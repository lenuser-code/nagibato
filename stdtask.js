/**
 * @file
 * namespace stdtaskを定義し, よく使うタスクの雛形を事前に用意しておく.
 *
 * @author lenuser
 */

/**
 * 頻繁に必要になり, かつGUIに直接依存しないタスクをまとめたnamespace.
 * 以下の要素が外部に公開される.
 *
 * - stdtask.Select
 * - stdtask.CyclicSelect
 * - stdtask.Scroll
 * - stdtask.Meter
 *
 * @namespace
 */
var stdtask = stdtask || {};
(function(Public){

/**
 * indexプロパティを持ち, キー入力に応じて
 *
 * - indexの増減
 * - this.action(GE, index)の実行
 * - this.cancel(GE, index)の実行
 *
 * を実行するタスクオブジェクトを実装する.
 *
 * ここで登場したindexプロパティは「複数の選択肢から1つを選ばせるUI」における
 * 現在選択されている要素のインデックスを抽象化したものである.
 *
 * たとえば, 「矢印キーでindexを変化させてEnterで決定, ESCでキャンセル」という
 * UIを作る場合,
 *
 * ```
 * class MyUI extends stdtask.Select{
 *     constructor(){
 *         super(選択肢の個数, ["ArrowUp", "ArrowDown"], "Enter", "Escape");
 *     }
 *
 *     action(GE, index){ 決定時の処理 }
 *     cancel(GE, index){ キャンセル時の処理 }
 * }
 * ```
 *
 * のようにすればよい. または, Selectを継承するのではなく,
 *
 * ```
 * class MyUI{
 *     constructor(){
 *         this.select = new stdtask.Select(
 *             選択肢の個数, ["ArrowUp", "ArrowDown"], "Enter", "Escape"
 *         );
 *         this.select.bind(this);
 *     }
 *
 *     execute(GE){ return this.select.execute(GE); }
 *     action(GE, index){ 決定時の処理 }
 *     cancel(GE, index){ キャンセル時の処理 }
 * }
 * ```
 *
 * のように委譲してもよい.
 *
 * @class
 * @prop {number} index - このオブジェクトが管理するパラメータ
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
Public.Select = class{
    #itemCount;
    #busy;
    #wait;
    #codes1;
    #codes2;
    #modal;

    /**
     * 指定された設定に基づきインスタンスを生成する.
     * @param {number} itemCount - 選択肢の個数. this.indexは 0 ～ (itemCount-1) の範囲を動く
     * @param {string[]} dirKeys - this.indexの増減に使うキーのキーコード. dirKeys[0]が減少,
     * dirKeys[1]が増加のキーとして扱われる
     * @param {string} actionKey - このキーが押されたとき, this.action を実行する
     * @param {string} cancelKey - このキーが押されたとき, this.cancel を実行する
     * @param {number} [firstValue=0] - this.indexの初期値
     * @param {number} [wait=10] - dirKeysに属するキーを押しっぱなしにしたとき,
     * どの程度の間隔が空いていればキーイベントを受理するか指定する
     * @param {boolean} [modal=true] - 自分より後ろのタスク処理をブロックするか
     */
    constructor(itemCount, dirKeys, actionKey, cancelKey, firstValue = 0, wait = 10, modal = true){
        this.#itemCount = itemCount;
        this.#busy = 0;
        this.#wait = wait;
        this.#codes1 = dirKeys.concat([actionKey, cancelKey]);
        this.#codes2 = [...dirKeys];
        this.#modal = modal;
        this.index = firstValue;
        this.active = true;
    }

    #checkInput(GE){
        if(this.#busy > 0) this.#busy--;
        return GE.input.checkInput(this.#codes1, this.#codes2, this.#busy);
    }

    /**
     * 1フレーム分のタスク処理を実行する.
     * 具体的には, キー入力に応じてthis.indexを増減させたり
     * this.action/this.cancel を実行したりする.
     *
     * 【注意】this.action/this.canelを実行したフレームでは, modalの設定と
     * 無関係に必ず false を返す. なぜならば, もしこれら処理の中で
     * タスクリストの変更が発生した場合「forループの途中で中身を変更する」のと
     * 同じ状況が生じるためである.
     * 後続のタスク処理をブロックすることで安全にループを抜けることができる.
     *
     * @param {stdgam.GameEngine} GE - タスク処理に用いるGameEngine
     * @returns 次のいずれかの条件を満たすとき false を返す
     * 1. 自分より後ろのタスク処理をブロックする設定の場合
     * 2. このフレームにおいてthis.action や this.cancel を実行した場合
     * そうでないとき true を返す
     */
    execute(GE){
        const [code, k] = this.#checkInput(GE);
        if(k >= 0) this.#busy = this.#wait;
        if(k < 0) return !this.#modal;

        if(k == 0 || k == 1){
            this.move(k, this.#itemCount);
        }
        if(k == 2){
            this.action(GE, this.index);
            return false;
        }
        if(k == 3){
            this.cancel(GE, this.index);
            return false;
        }
        return !this.#modal;
    }

    /**
     * k == 0 のとき, this.indexを1減らす (ただし0未満にはならない).
     * k == 1 のとき, this.indexを1増やす (ただし「選択肢の個数-1」を超えない).
     */
    move(k, itemCount){
        if(k == 0 && this.index > 0) this.index--;
        if(k == 1 && this.index < itemCount - 1) this.index++;
    }

    /**
     * actionやcancelの実行を指定したオブジェクトに委任する.
     * すなわち, 以下の処理を行う.
     *
     * - other.action(GE, index) を実行するだけの関数を this.action に代入
     * - other.cancel(GE, index) を実行するだけの関数を this.cancel に代入
     *
     * @param {Object} other - action/cancelの処理を委任されるオブジェクト
     */
    bind(other){
        this.action = (GE, index) => { other.action(GE, index) };
        this.cancel = (GE, index) => { other.cancel(GE, index) };
    }

    /**
     * actionKeyとして指定したキーが押されたときに呼び出される.
     * デフォルトでは何もしない.
     * @param {stdgam.GameEngine} GE - タスク処理を実行するために使うGameEngine
     * @param {number} index - this.indexの値
     */
    action(GE, index){ }

    /**
     * cancelKeyとして指定したキーが押されたときに呼び出される.
     * デフォルトでは何もしない.
     * @param {stdgam.GameEngine} GE - タスク処理を実行するために使うGameEngine
     * @param {number} index - this.indexの値
     */
    cancel(GE, index){ }
}

/**
 * indexをこれ以上減らせないときは取りうる最大値に,
 * 逆にindexをこれ以上増やせないときは 0 にワープするようSelectを改変したもの.
 * @class
 * @prop {number} index - このオブジェクトが管理するパラメータ
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
Public.CyclicSelect = class extends Public.Select{
    /**
     * (a + b) の値を m で割った余りを返す. ゼロ除算のチェックなどはしない.
     * @param {number} a
     * @param {number} b
     * @param {number} m
     * @returns {number} (a + b) % m の値
     */
    addMod(a, b, m){
        return (a + b + m) % m;
    }

    /**
     * k == 0 のときはthis.indexを1減らし, k == 1 のときはthis.indexを1増やす.
     * ただし, 結果が0未満になるときは「選択肢の個数-1」に変更し,
     * 逆に結果が「選択肢の個数以上」になるときは0にする.
     */
    move(k, itemCount){
        this.index = this.addMod(this.index, 2 * k -1, itemCount);
    };
}

/**
 * 指定されたSelectオブジェクトをラップし, スクロール機能を追加するクラス.
 * すなわち, indexの値をscroll + offset (0 <= offset < viewCount) に分解し,
 * かつ, 直前の状態からの遷移が自然になるようにこれらの値を更新する.
 *
 * たとえば「optionsの要素のうち一度に表示できるものの個数が最大5個」であるような
 * UIを作りたい場合, 次のようなコードを書く.
 *
 * ```
 * class MyUI extends stdtask.Scroll{
 *     constructor(options){
 *         const select = new stdtask.Select(
 *             options.length, ["ArrowUp", "ArrowDown"], "Enter", "Escape"
 *         );
 *         super(select, 5);
 *         this.options = options;
 *     }
 *
 *     draw(GE, ctx){
 *         for(let i = 0; i < 5; i++){
 *             const targetIndex = this.scroll + i;
 *             my_paint_operation( this.options[targetIndex] );  // 普通はiも使うはずだが
 *         }
 *     }
 *
 *     action(GE, index){ 決定時の処理 }
 *     cancel(GE, index){ キャンセル時の処理 }
 * }
 * ```
 *
 * 選択肢の個数が表示できる最大数に満たない場合, 普通にSelectを使うのと変わらない.
 * また, SelectではなくCyclicSelectを渡してもよい.
 * @class
 * @prop {number} scroll - 現在のスクロール量
 * @prop {number} offset - 現在の表示区間において選択されている要素が何番目にあるか.
 * より正確には selectObj.index == this.scroll + this.offset を満たす整数である
 * (selectObjはコンストラクタで与えたSelectオブジェクト)
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
Public.Scroll = class{
    #contents;
    #viewCount;

    /**
     * 一度に表示できる選択肢の個数がviewCountであるようなインスタンスを作る.
     * @param {stdtask.Select} selectObj - ラップするSelectオブジェクト (CyclicSelectなどでも可)
     * @param {number} viewCount - 一度に表示できる選択肢の個数
     */
    constructor(selectObj, viewCount){
        this.#contents = selectObj;
        this.#viewCount = viewCount;
        this.initScroll();
        selectObj.bind(this);
        this.active = true;
    }

    /**
     * @returns {number} 一度に表示できる選択肢の個数
     */
    viewCount(){
        return this.#viewCount;
    }

    /**
     * 1フレーム分のタスク処理を行う.
     * より正確には, ラップされているSelectオブジェクトのexecuteを実行した後,
     * その結果に基づき this.scroll と this.offset を更新する.
     * @param {stdgam.GameEngine} GE - タスク処理に用いるGameEngine
     */
    execute(GE){
        const f = this.#contents.execute(GE);
        this.#updateScroll(this.#contents.index - this.scroll - this.offset);
        return f;
    }

    /**
     * ラップされているSelectオブジェクトのindexの値を元に,
     * this.scroll と this.offset の値を初期化する.
     *
     * 具体的には次のように決める.
     *
     * 1. indexの値がviewCount未満なら, scroll = 0, offset = index でよい.
     * 2. そうでないとき, 先に offset = viewCount - 1 を決定してしまい,
     *
     * それから scroll = index - offset とすればよい.
     */
    initScroll(){
        this.scroll = this.#contents.index - this.#viewCount + 1;
        if(this.scroll <= 0){
            this.scroll = 0;
            this.offset = this.#contents.index;
        }
        else{
            this.offset = this.#viewCount - 1;
        }
    }

    // contents.indexの値の変化量から自身の次の状態を決める.
    #updateScroll(d){
        if(d > 1 || d < -1){
            this.initScroll();  // 先頭と末尾の間の移動が発生した
        }
        if(d == -1){
            if(this.offset > 0) this.offset--;
            else this.scroll--;
        }
        if(d == 1){
            if(this.offset < this.#viewCount - 1) this.offset++;
            else this.scroll++;
        }
    }

    /**
     * actionやcancelの実行を指定したオブジェクトに委任する.
     * すなわち, 以下の処理を行う.
     *
     * - other.action(GE, index) を実行するだけの関数を this.action に代入
     * - other.cancel(GE, index) を実行するだけの関数を this.cancel に代入
     *
     * @param {Object} other - action/cancelの処理を委任されるオブジェクト
     */
    bind(other){
        this.action = (GE, index) => { other.action(GE, index) };
        this.cancel = (GE, index) => { other.cancel(GE, index) };
    }

    /**
     * actionKeyとして指定したキーが押されたときに呼び出される.
     * デフォルトでは何もしない.
     * @param {stdgam.GameEngine} GE - タスク処理を実行するために使うGameEngine
     * @param {number} index - this.indexの値
     */
    action(GE, index){ }

    /**
     * cancelKeyとして指定したキーが押されたときに呼び出される.
     * デフォルトでは何もしない.
     * @param {stdgam.GameEngine} GE - タスク処理を実行するために使うGameEngine
     * @param {number} index - this.indexの値
     */
    cancel(GE, index){ }
}

/**
 * 数値の等速変化を実現するMeterオブジェクトを作る.
 * あるパラメータがAからBへ変化するとき, モデル内部では一瞬で値がBになるが,
 * GUIではAからBまで一定の時間を掛けて変化する様子を描画したい.
 * この時間変化を表現するために使う.
 * @class
 * @prop {number} value - そのパラメータの現在値
 * @prop {number} max - パラメータの最大値
 * @prop {number} frames - 等速変化に掛けるフレーム数 (既に実行中のアクションには影響しない)
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
Public.Meter = class{
    #sv;
    #tv;
    #duration;
    #elapsed;

    constructor(v, max, frames){
        this.init(v, max, frames);
    }

    /**
     * 初期化する.
     */
    init(newValue, newMax, newFrames = null){
        this.value = this.#sv = this.#tv = newValue;
        this.max = newMax;
        this.frames = newFrames || this.frames;
        this.#duration = this.#elapsed = 0;
        this.active = true;
    }

    /**
     * 目標値への変化を開始する.
     */
    changeTo(target, dur = this.frames){
        this.#sv = this.value;
        this.#tv = target;
        this.#duration = dur;
        this.#elapsed = 0;
        this.active = true;
    }

    /**
     * 1フレーム分のタスク処理を実行する.
     */
    execute(GE){
        if(this.#elapsed < this.#duration){
            this.#elapsed++;

            // 残りのフレーム数を全体フレーム数で割った比を求める.
            // ただし, 残りがないときは厳密に 0 になるようにする.
            let t = 0;
            if(this.#elapsed < this.#duration){
                t = (this.#duration - this.#elapsed) / this.#duration;
            }

            // ゴールから逆算して現在値を決める.
            const v = Math.floor(this.#tv - (this.#tv - this.#sv) * t);
            this.value = Math.max(0, Math.min(this.max, v));
        }
        return true;
    }
}

})(stdtask);
