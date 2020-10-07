/// <reference path="phinaFile/globalized/index.d.ts" />
//型定義ファイルの読み込み

// グローバルに展開、phina.hoge.hugaがhugaに省略できる
//省略したくない場合型定義ファイルを変えてglobalizeを消す
//TODO: moduleを分けるとエラーが出る
phina.globalize();

var Scenes = [
    {
        label: "MainScene",
        className: "MainScene",
        nextLabel: "Main"
    },
    {
        label: "TitleScene",
        className: "TitleScene",
        nextLabel: "MainScene"
    },
    {
        label: "ClearScene",
        className: "ClearScene",
        nextLabel: "TitleScene"
    }
];

var ASSETS = {
    image: {
        'puzzle': 'img/puzzle.png',
    },
};

//グローバル
let App: GameApp;
const WindowWidth = 640;
//後で書き換える
let myGrid = Grid({
    width: WindowWidth,
    columns: 3,// パズルのn×n、あとで更新するのでとりあえず3
});
let Rand = Random;
// パズル位置
let TopMargin = 100;

phina.main(function () {
    App = GameApp({
        scenes: Scenes,
        startLabel: "TitleScene",
        assets: ASSETS,
    });
    App.run();
});

class Piece extends Sprite {
    private readonly AdjustSize: number = 0.01;
    private readonly PuzzleSize: number = 3;//とりあえず3×3
    public readonly FirstIndex: Vector2;//クリアチェックで使う最初の位置
    public CurrentIndex: Vector2;//自分のインデックスの位置をとる

    constructor(vec: Vector2, windowSize: number, puzzleSize: number) {
        super('puzzle');
        this.FirstIndex = vec;
        this.CurrentIndex = vec;
        this.PuzzleSize = puzzleSize;
        this.setScale(windowSize / this.width, windowSize / this.height);
        this.height /= this.PuzzleSize;
        this.width /= this.PuzzleSize;
        this.height -= this.height * this.AdjustSize;
        this.width -= this.width * this.AdjustSize;
        //中心基準
        this.setOrigin(0.5, 0.5);
        this.setPosition(myGrid.span(vec.x + 0.5), myGrid.span(vec.y + 0.5) + TopMargin);

        //分割した画像のうち表示するものを選ぶ、
        //height , widthの大きさによって分割される数が決まるっぽい
        //1,2,..n
        //n+1,n+2,..2nの雰囲気で選ぶ
        this.frameIndex = vec.x
            + vec.y * this.PuzzleSize;
        this.setInteractive(true, "rect");
    }

    //押されはじめた時の処理
    onpointstart = () => {
        if (MainScene.canMove(new Vector2(this.CurrentIndex.x, this.CurrentIndex.y))) {
            MainScene.swapPiece(this, MainScene.TransparentPiece, true);
        }
    }

    public indexTest = () => {
        if (this.FirstIndex.x === this.CurrentIndex.x && this.FirstIndex.y === this.CurrentIndex.y) {
            return true;
        }
        return false;
    }
}

class TitleButton extends Button {
    private static IsSceneChanging: boolean = false;//アニメーションの排他性を保つ
    PuzzleSize: number;
    Scene: TitleScene;
    private static readonly Num: number = 6;
    private static Buttons: Array<TitleButton> = new Array<TitleButton>(TitleButton.Num);

    constructor(scene: TitleScene, pos: Vector2, num: number) {
        super({ text: num.toString(), cornerRadius: 50 });
        this.setWidth(100);
        this.setHeight(100);
        this.position = pos;
        this.PuzzleSize = num;
        this.Scene = scene;
        TitleButton.Buttons[num - 3] = this;
    }

    //押された時のイベント
    onpointend = () => {
        if (TitleButton.IsSceneChanging == true) {
            return;
        }
        TitleButton.IsSceneChanging = false;
        //TODO:これは引数の渡し方がany型であれなのでapp.replaceSceneでシーンを変更するようにしたい(なんかバグる)
        //パズル設置のグリッドを更新
        myGrid = Grid({
            width: WindowWidth,
            columns: this.PuzzleSize

        });
        //選択されなかったのを消す
        for (var i = 0; i < TitleButton.Num; i++) {
            if (TitleButton.Buttons[i] !== this) {
                TitleButton.Buttons[i].remove();
            }
        }
        TitleRectButton.RemoveAll();
        //アニメーション
        Tweener().to({ x: myGrid.center(), y: 400 }, 1000, "easeOutExpo").attachTo(this);
        Tweener().rotateTo(-360, 1500, "easeOutElastic").attachTo(this);
        Tweener().scaleTo(3, 1000, "easeOutExpo").attachTo(this).wait(500).call(() => {
            this.Scene.exit("MainScene", { puzzleSize: this.PuzzleSize });
        });
    }
}

class TitleRectButton extends Button {
    private static AllTitleRect: Array<TitleRectButton> = new Array();
    URL: string;
    constructor(text: string, pos: Vector2, str: string) {
        super({ text: text, width: 500 });
        this.setPosition(pos.x, pos.y);
        this.URL = str;
        TitleRectButton.AllTitleRect.push(this);
    }

    public static RemoveAll = () => {
        TitleRectButton.AllTitleRect.forEach((el) => {
            el.remove();
        })
    }

    onpointend = () => {
        window.location.href = this.URL;
    }
}

class TitleScene extends DisplayScene {
    constructor() {
        super();
        this.backgroundColor = 'skyblue';
        let titleGrid = Grid({
            width: WindowWidth,
            columns: 4,
        })

        //TitleButton.Numの個数に合わせる
        for (let i = 0; i < 2; i++) {
            for (let t = 0; t < 3; t++) {
                new TitleButton(this, new Vector2(titleGrid.center(t - 1), titleGrid.center(i - 1)), t + i * 3 + 3).addChildTo(this);
            }
        }

        new TitleRectButton("phina.js", new Vector2(WindowWidth / 2, 600), "https://cdn.rawgit.com/phi-jp/phina.js/v0.2.3/build/phina.js").addChildTo(this);
        new TitleRectButton("型定義ファイル", new Vector2(WindowWidth / 2, 700), "https://github.com/negiwine/phina.js.d.ts/blob/master/LICENSE.txt").addChildTo(this);
    }
}

class ClearScene extends DisplayScene {
    private ClearMinutes = 0;
    private ClearSeconds = 0;
    private AnimationEndFrag: boolean;
    constructor(param) {
        super();
        this.ClearMinutes = param.minutes;
        this.ClearSeconds = param.seconds;
        this.AnimationEndFrag = false;
        this.backgroundColor = 'skyblue';

        //クリア時間表示
        let disp = Label({
            text: this.ClearMinutes.toString() + ": " + this.ClearSeconds.toFixed(3).toString(),
            fontSize: 80,
        }).addChildTo(this).setPosition(-WindowWidth / 2, window.screen.height / 2);

        //スコア移動アニメーション
        disp.tweener.wait(100).moveBy(WindowWidth, 0, 500, "liner").call(() => {
            this.AnimationEndFrag = true;
        })
    }

    onpointend = () => {
        if (this.AnimationEndFrag) {
            this.exit("TitleScene", {});
        }
    }
}


class MainScene extends DisplayScene {
    private PuzzleSize: number = 0;
    public static TransparentPiece: Piece;
    private PieceArray: Piece[][];
    private Cleared: boolean;//クリアしたか
    private IsCountMax: boolean;//59:59.999で止める
    private Second: number;
    private Minutes: number;
    private TimeLabel: Label;

    constructor(param) {
        super();
        this.PuzzleSize = param.puzzleSize;
        this.PieceArray = new Array<Piece[]>(this.PuzzleSize);
        this.IsCountMax = false;
        this.Cleared = false;
        this.Second = 0;
        this.Minutes = 0;
        this.TimeLabel = new Label({ text: this.Second.toString(), x: WindowWidth / 2 - 120, y: 850 }).addChildTo(this);
        this.backgroundColor = 'skyblue';

        //背景
        let back = Shape().addChildTo(this);
        back.setWidth(WindowWidth).setHeight(WindowWidth).setPosition(WindowWidth / 2, TopMargin + WindowWidth / 2);
        let littleback = Shape().addChildTo(this);
        littleback.setWidth(WindowWidth / this.PuzzleSize).setHeight(WindowWidth / this.PuzzleSize).setPosition(myGrid.span(this.PuzzleSize - 0.5), myGrid.span(this.PuzzleSize + 0.5) + TopMargin)

        //二次元配列初期化、右下の1マスを下に動かすため1マス大きくとる。とりあえずダミーのピースを入れる
        for (let i = 0; i < this.PuzzleSize + 1; i++) {
            this.PieceArray[i] = new Array<Piece>(this.PuzzleSize).fill(new Piece(Vector2(0, 0), 0, 0));
        }

        //パズル作成
        for (let i = 0; i < this.PuzzleSize; i++) {
            for (let t = 0; t < this.PuzzleSize; t++) {
                this.PieceArray[t][i] = new Piece(Vector2(t, i), this.width, this.PuzzleSize).addChildTo(this);
            }
        }
        //右下に透明なピースを作成、
        MainScene.TransparentPiece = new Piece(Vector2(this.PuzzleSize - 1, this.PuzzleSize), this.width, this.PuzzleSize).addChildTo(this);
        MainScene.TransparentPiece.setVisible(false);
        this.PieceArray[this.PuzzleSize - 1][this.PuzzleSize] = MainScene.TransparentPiece;
        //パズル混ぜる、引数は必ず偶数
        this.shuffle(1000);
    }

    //偶数回混ぜないとクリア不可能なので気合で調整する
    private shuffle = (repeatNum: number) => {
        do {
            for (let i = 0; i < repeatNum; i++) {
                let t1 = this.PieceArray[Rand.randint(0, this.PuzzleSize - 1)][Rand.randint(0, this.PuzzleSize - 1)];
                let t2 = this.PieceArray[Rand.randint(0, this.PuzzleSize - 1)][Rand.randint(0, this.PuzzleSize - 1)];
                //混ぜ回数調整、一番右下のピースと交換させない、同じ位置だと混ざらないのでもう一回
                if (t1 == this.PieceArray[this.PuzzleSize - 1][this.PuzzleSize - 1] || t2 == this.PieceArray[this.PuzzleSize - 1][this.PuzzleSize - 1] || t1 == t2) {
                    i--;
                    continue;
                }
                MainScene.swapPiece(t1, t2, false);
            }
        } while (this.clearCheck() == true) //初期クリア防止
        //右下のピースを下にずらす
        MainScene.swapPiece(this.PieceArray[this.PuzzleSize - 1][this.PuzzleSize], this.PieceArray[this.PuzzleSize - 1][this.PuzzleSize - 1], false);
    }

    //位置を変える、クリアのチェックのためにインデックスと位置の整合性を保つ
    public static swapPiece = (p1: Piece, p2: Piece, animation: boolean) => {
        let tempPos = p1.position;
        let tempInd = p1.CurrentIndex
        //TODO:アニメーションバグる
        /*animation ? p1.tweener.moveTo(p2.x, p2.y, 50, "easeOutExpo") : */p1.position = p2.position;
        p1.CurrentIndex = p2.CurrentIndex;
        /*animation ? p2.tweener.moveTo(tempPos.x, tempPos.y, 50, "easeOutExpo"):*/  p2.position = tempPos;
        p2.CurrentIndex = tempInd;
    }

    //ピースの移動ができるか？配列の位置で確認、透明ピースに隣接してるやつが可能
    public static canMove = (index: Vector2) => {
        var transIndex = MainScene.TransparentPiece.CurrentIndex;
        if (index.x + 1 == transIndex.x && index.y == transIndex.y ||
            index.x - 1 == transIndex.x && index.y == transIndex.y ||
            index.x == transIndex.x && index.y + 1 == transIndex.y ||
            index.x == transIndex.x && index.y - 1 == transIndex.y)
            return true;
        return false;
    }

    private clearCheck = () => {
        for (let row = 0; row < this.PuzzleSize; row++)
            for (let col = 0; col < this.PuzzleSize; col++)
                if (this.PieceArray[col][row].indexTest() == false)
                    return false;
        return true;
    }

    update = () => {
        this.timerCounter();
    }

    timerCounter = () => {
        if (this.Cleared == true || this.IsCountMax == true) {
            return;
        }
        this.Second += App.deltaTime / 1000;
        if (this.Second >= 60) {
            this.Minutes++;
            this.Second -= 60;
        }
        if (this.Minutes == 60) {
            this.IsCountMax = true;
            this.Minutes = 59;
            //下のfixedに合わせる
            this.Second = 59.999;
        }
        this.TimeLabel.text = (this.Minutes + ":" + this.Second.toFixed(3)).toString();
    }


    onpointstart = () => {
        if (this.Cleared) {
            this.exit("ClearScene", { seconds: this.Second, minutes: this.Minutes })
        }

        if (this.clearCheck() == true && this.Cleared == false) {
            this.Cleared = true;
            // ピース削除処理（すぐシーン遷移するなら必要ないかもしれない）
            for (let row = 0; row < this.PuzzleSize; row++) {
                for (let col = 0; col < this.PuzzleSize; col++) {
                    let piece = this.PieceArray[col][row];
                    piece.setInteractive(false, "rect");//タッチの設定をoffにして動くのを阻止
                    piece.remove();
                    // 完成した時にいい感じのアニメーションをつけようとしたけどあんまりきれいじゃないので廃止
                    // Tweener().scaleBy(-t, second, "liner").scaleBy(t, second, "liner").attachTo(piece);
                    // var self = this;
                    // Tweener().rotateBy(360, second, "default").attachTo(piece).call(function () {
                    //     var spr = new Sprite("puzzle");
                    //     spr.position = new Vector2(WindowWidth / 2, WindowWidth / 2 + TopMargin);
                    //     spr.setWidth(WindowWidth).setHeight(WindowWidth);
                    //     spr.addChildTo(self);
                    // }).call(() => {
                    //     this.EndAnimation = true;
                    //     piece.remove();
                    // });
                }
            }
            // 削除した後に完成した画像を表示する
            var spr = new Sprite("puzzle");
            spr.position = new Vector2(WindowWidth / 2, WindowWidth / 2 + TopMargin);
            spr.setWidth(WindowWidth).setHeight(WindowWidth);
            spr.addChildTo(this);
            var self = this;
            Tweener().rotateBy
            let disp = Label({
                text: "クリックして次へ",
                fontSize: 60,
            }).addChildTo(this).setPosition(WindowWidth / 2, window.screen.height - 100)
            .tweener.fadeOut(500).fadeIn(500).setLoop(true)
        }
    }
}