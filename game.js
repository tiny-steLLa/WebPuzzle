/// <reference path="phinaFile/globalized/index.d.ts" />
//型定義ファイルの読み込み
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        'puzzle': 'img/puzzle.png'
    }
};
//グローバル
var App;
var WindowWidth = 640;
//後で書き換える
var myGrid = Grid({
    width: WindowWidth,
    columns: 3
});
var Rand = Random;
// パズル位置
var TopMargin = 100;
phina.main(function () {
    App = GameApp({
        scenes: Scenes,
        startLabel: "TitleScene",
        assets: ASSETS
    });
    App.run();
});
var Piece = /** @class */ (function (_super) {
    __extends(Piece, _super);
    function Piece(vec, windowSize, puzzleSize) {
        var _this = _super.call(this, 'puzzle') || this;
        _this.AdjustSize = 0.01;
        _this.PuzzleSize = 3; //とりあえず3×3
        //押されはじめた時の処理
        _this.onpointstart = function () {
            if (MainScene.canMove(new Vector2(_this.CurrentIndex.x, _this.CurrentIndex.y))) {
                MainScene.swapPiece(_this, MainScene.TransparentPiece, true);
            }
        };
        _this.indexTest = function () {
            if (_this.FirstIndex.x === _this.CurrentIndex.x && _this.FirstIndex.y === _this.CurrentIndex.y) {
                return true;
            }
            return false;
        };
        _this.FirstIndex = vec;
        _this.CurrentIndex = vec;
        _this.PuzzleSize = puzzleSize;
        _this.setScale(windowSize / _this.width, windowSize / _this.height);
        _this.height /= _this.PuzzleSize;
        _this.width /= _this.PuzzleSize;
        _this.height -= _this.height * _this.AdjustSize;
        _this.width -= _this.width * _this.AdjustSize;
        //中心基準
        _this.setOrigin(0.5, 0.5);
        _this.setPosition(myGrid.span(vec.x + 0.5), myGrid.span(vec.y + 0.5) + TopMargin);
        //分割した画像のうち表示するものを選ぶ、
        //height , widthの大きさによって分割される数が決まるっぽい
        //1,2,..n
        //n+1,n+2,..2nの雰囲気で選ぶ
        _this.frameIndex = vec.x
            + vec.y * _this.PuzzleSize;
        _this.setInteractive(true, "rect");
        return _this;
    }
    return Piece;
}(Sprite));
var TitleButton = /** @class */ (function (_super) {
    __extends(TitleButton, _super);
    function TitleButton(scene, pos, num) {
        var _this = _super.call(this, { text: num.toString(), cornerRadius: 50 }) || this;
        //押された時のイベント
        _this.onpointend = function () {
            if (TitleButton.IsSceneChanging == true) {
                return;
            }
            TitleButton.IsSceneChanging = false;
            //TODO:これは引数の渡し方がany型であれなのでapp.replaceSceneでシーンを変更するようにしたい(なんかバグる)
            //パズル設置のグリッドを更新
            myGrid = Grid({
                width: WindowWidth,
                columns: _this.PuzzleSize
            });
            //選択されなかったのを消す
            for (var i = 0; i < TitleButton.Num; i++) {
                if (TitleButton.Buttons[i] !== _this) {
                    TitleButton.Buttons[i].remove();
                }
            }
            TitleRectButton.RemoveAll();
            //アニメーション
            Tweener().to({ x: myGrid.center(), y: 400 }, 1000, "easeOutExpo").attachTo(_this);
            Tweener().rotateTo(-360, 1500, "easeOutElastic").attachTo(_this);
            Tweener().scaleTo(3, 1000, "easeOutExpo").attachTo(_this).wait(500).call(function () {
                _this.Scene.exit("MainScene", { puzzleSize: _this.PuzzleSize });
            });
        };
        _this.setWidth(100);
        _this.setHeight(100);
        _this.position = pos;
        _this.PuzzleSize = num;
        _this.Scene = scene;
        TitleButton.Buttons[num - 3] = _this;
        return _this;
    }
    TitleButton.IsSceneChanging = false; //アニメーションの排他性を保つ
    TitleButton.Num = 6;
    TitleButton.Buttons = new Array(TitleButton.Num);
    return TitleButton;
}(Button));
var TitleRectButton = /** @class */ (function (_super) {
    __extends(TitleRectButton, _super);
    function TitleRectButton(text, pos, str) {
        var _this = _super.call(this, { text: text, width: 500 }) || this;
        _this.onpointend = function () {
            window.location.href = _this.URL;
        };
        _this.setPosition(pos.x, pos.y);
        _this.URL = str;
        TitleRectButton.AllTitleRect.push(_this);
        return _this;
    }
    TitleRectButton.AllTitleRect = new Array();
    TitleRectButton.RemoveAll = function () {
        TitleRectButton.AllTitleRect.forEach(function (el) {
            el.remove();
        });
    };
    return TitleRectButton;
}(Button));
var TitleScene = /** @class */ (function (_super) {
    __extends(TitleScene, _super);
    function TitleScene() {
        var _this = _super.call(this) || this;
        _this.backgroundColor = 'skyblue';
        var titleGrid = Grid({
            width: WindowWidth,
            columns: 4
        });
        //TitleButton.Numの個数に合わせる
        for (var i = 0; i < 2; i++) {
            for (var t = 0; t < 3; t++) {
                new TitleButton(_this, new Vector2(titleGrid.center(t - 1), titleGrid.center(i - 1)), t + i * 3 + 3).addChildTo(_this);
            }
        }
        new TitleRectButton("phina.js", new Vector2(WindowWidth / 2, 600), "https://cdn.rawgit.com/phi-jp/phina.js/v0.2.3/build/phina.js").addChildTo(_this);
        new TitleRectButton("型定義ファイル", new Vector2(WindowWidth / 2, 700), "https://github.com/negiwine/phina.js.d.ts/blob/master/LICENSE.txt").addChildTo(_this);
        return _this;
    }
    return TitleScene;
}(DisplayScene));
var ClearScene = /** @class */ (function (_super) {
    __extends(ClearScene, _super);
    function ClearScene(param) {
        var _this = _super.call(this) || this;
        _this.ClearMinutes = 0;
        _this.ClearSeconds = 0;
        _this.onpointend = function () {
            if (_this.AnimationEndFrag) {
                _this.exit("TitleScene", {});
            }
        };
        _this.ClearMinutes = param.minutes;
        _this.ClearSeconds = param.seconds;
        _this.AnimationEndFrag = false;
        _this.backgroundColor = 'pink';
        //クリア時間表示
        var disp = Label({
            text: _this.ClearMinutes.toString() + ": " + _this.ClearSeconds.toFixed(3).toString(),
            fontSize: 80
        }).addChildTo(_this).setPosition(-WindowWidth / 2, window.screen.height / 2);
        //スコア移動アニメーション
        disp.tweener.wait(100).moveBy(WindowWidth, 0, 500, "liner").call(function () {
            _this.AnimationEndFrag = true;
        });
        return _this;
    }
    return ClearScene;
}(DisplayScene));
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(param) {
        var _this = _super.call(this) || this;
        _this.PuzzleSize = 0;
        //偶数回混ぜないとクリア不可能なので気合で調整する
        _this.shuffle = function (repeatNum) {
            do {
                for (var i = 0; i < repeatNum; i++) {
                    var t1 = _this.PieceArray[Rand.randint(0, _this.PuzzleSize - 1)][Rand.randint(0, _this.PuzzleSize - 1)];
                    var t2 = _this.PieceArray[Rand.randint(0, _this.PuzzleSize - 1)][Rand.randint(0, _this.PuzzleSize - 1)];
                    //混ぜ回数調整、一番右下のピースと交換させない、同じ位置だと混ざらないのでもう一回
                    if (t1 == _this.PieceArray[_this.PuzzleSize - 1][_this.PuzzleSize - 1] || t2 == _this.PieceArray[_this.PuzzleSize - 1][_this.PuzzleSize - 1] || t1 == t2) {
                        i--;
                        continue;
                    }
                    MainScene.swapPiece(t1, t2, false);
                }
            } while (_this.clearCheck() == true); //初期クリア防止
            //右下のピースを下にずらす
            MainScene.swapPiece(_this.PieceArray[_this.PuzzleSize - 1][_this.PuzzleSize], _this.PieceArray[_this.PuzzleSize - 1][_this.PuzzleSize - 1], false);
        };
        _this.clearCheck = function () {
            for (var row = 0; row < _this.PuzzleSize; row++)
                for (var col = 0; col < _this.PuzzleSize; col++)
                    if (_this.PieceArray[col][row].indexTest() == false)
                        return false;
            return true;
        };
        _this.update = function () {
            _this.timerCounter();
        };
        _this.timerCounter = function () {
            if (_this.Cleared == true || _this.IsCountMax == true) {
                return;
            }
            _this.Second += App.deltaTime / 1000;
            if (_this.Second >= 60) {
                _this.Minutes++;
                _this.Second -= 60;
            }
            if (_this.Minutes == 60) {
                _this.IsCountMax = true;
                _this.Minutes = 59;
                //下のfixedに合わせる
                _this.Second = 59.999;
            }
            _this.TimeLabel.text = (_this.Minutes + ":" + _this.Second.toFixed(3)).toString();
        };
        _this.onpointstart = function () {
            if (_this.Cleared) {
                _this.exit("ClearScene", { seconds: _this.Second, minutes: _this.Minutes });
            }
            if (_this.clearCheck() == true && _this.Cleared == false) {
                _this.Cleared = true;
                // ピース削除処理（すぐシーン遷移するなら必要ないかもしれない）
                for (var row = 0; row < _this.PuzzleSize; row++) {
                    for (var col = 0; col < _this.PuzzleSize; col++) {
                        var piece = _this.PieceArray[col][row];
                        piece.setInteractive(false, "rect"); //タッチの設定をoffにして動くのを阻止
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
                spr.addChildTo(_this);
                var self = _this;
                Tweener().rotateBy;
                var disp = Label({
                    text: "クリックして次へ",
                    fontSize: 60
                }).addChildTo(_this).setPosition(WindowWidth / 2, window.screen.height - 100)
                    .tweener.fadeOut(500).fadeIn(500).setLoop(true);
            }
        };
        _this.PuzzleSize = param.puzzleSize;
        _this.PieceArray = new Array(_this.PuzzleSize);
        _this.IsCountMax = false;
        _this.Cleared = false;
        _this.Second = 0;
        _this.Minutes = 0;
        _this.TimeLabel = new Label({ text: _this.Second.toString(), x: WindowWidth / 2 - 120, y: 850 }).addChildTo(_this);
        _this.backgroundColor = 'skyblue';
        //背景
        var back = Shape().addChildTo(_this);
        back.setWidth(WindowWidth).setHeight(WindowWidth).setPosition(WindowWidth / 2, TopMargin + WindowWidth / 2);
        var littleback = Shape().addChildTo(_this);
        littleback.setWidth(WindowWidth / _this.PuzzleSize).setHeight(WindowWidth / _this.PuzzleSize).setPosition(myGrid.span(_this.PuzzleSize - 0.5), myGrid.span(_this.PuzzleSize + 0.5) + TopMargin);
        //二次元配列初期化、右下の1マスを下に動かすため1マス大きくとる。とりあえずダミーのピースを入れる
        for (var i = 0; i < _this.PuzzleSize + 1; i++) {
            _this.PieceArray[i] = new Array(_this.PuzzleSize).fill(new Piece(Vector2(0, 0), 0, 0));
        }
        //パズル作成
        for (var i = 0; i < _this.PuzzleSize; i++) {
            for (var t = 0; t < _this.PuzzleSize; t++) {
                _this.PieceArray[t][i] = new Piece(Vector2(t, i), _this.width, _this.PuzzleSize).addChildTo(_this);
            }
        }
        //右下に透明なピースを作成、
        MainScene.TransparentPiece = new Piece(Vector2(_this.PuzzleSize - 1, _this.PuzzleSize), _this.width, _this.PuzzleSize).addChildTo(_this);
        MainScene.TransparentPiece.setVisible(false);
        _this.PieceArray[_this.PuzzleSize - 1][_this.PuzzleSize] = MainScene.TransparentPiece;
        //パズル混ぜる、引数は必ず偶数
        _this.shuffle(1000);
        return _this;
    }
    //位置を変える、クリアのチェックのためにインデックスと位置の整合性を保つ
    MainScene.swapPiece = function (p1, p2, animation) {
        var tempPos = p1.position;
        var tempInd = p1.CurrentIndex;
        //TODO:アニメーションバグる
        /*animation ? p1.tweener.moveTo(p2.x, p2.y, 50, "easeOutExpo") : */ p1.position = p2.position;
        p1.CurrentIndex = p2.CurrentIndex;
        /*animation ? p2.tweener.moveTo(tempPos.x, tempPos.y, 50, "easeOutExpo"):*/ p2.position = tempPos;
        p2.CurrentIndex = tempInd;
    };
    //ピースの移動ができるか？配列の位置で確認、透明ピースに隣接してるやつが可能
    MainScene.canMove = function (index) {
        var transIndex = MainScene.TransparentPiece.CurrentIndex;
        if (index.x + 1 == transIndex.x && index.y == transIndex.y ||
            index.x - 1 == transIndex.x && index.y == transIndex.y ||
            index.x == transIndex.x && index.y + 1 == transIndex.y ||
            index.x == transIndex.x && index.y - 1 == transIndex.y)
            return true;
        return false;
    };
    return MainScene;
}(DisplayScene));
