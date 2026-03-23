/**
 * @file
 * namespace stdtaskを定義し, よく使うタスクの雛形を事前に用意しておく.
 *
 * @author lenuser
 */

/**
 * 頻繁に必要になり, かつGUIに直接依存しないタスクをまとめたnamespace.
 * 以下の要素が外部に公開される.
 * - stdtask.Select
 * - stdtask.CyclicSelect
 * - stdtask.Scroll
 *
 * @namespace
 */
var stdtask = stdtask || {};
(function(Public){

/**
 * index要素を持ち, キー入力に応じて
 * - indexの増減
 * - this.action(GE, index)の実行
 * - this.cancel(GE, index)の実行
 * を実行するタスクオブジェクトを実装する.
 * @class
 */
Public.Select = class{
    #itemCount;
    #busy;
    #wait;
    #codes1;
    #codes2;
    #modal;

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

    move(k, itemCount){
        if(k == 0 && this.index > 0) this.index--;
        if(k == 1 && this.index < itemCount - 1) this.index++;
    }

    bind(other){
        this.action = (GE, index) => { other.action(GE, index) };
        this.cancel = (GE, index) => { other.cancel(GE, index) };
    }

    action(GE, index){ }
    cancel(GE, index){ }
}

/**
 * indexをこれ以上減らせないときは取りうる最大値に,
 * 逆にindexをこれ以上増やせないときは 0 にワープするようSelectを改変したもの.
 * @class
 */
Public.CyclicSelect = class extends Public.Select{
    addMod(a, b, m){
        return (a + b + m) % m;
    }

    move(k, itemCount){
        this.index = this.addMod(this.index, 2 * k -1, itemCount);
    };
}

/**
 * 指定されたSelectオブジェクトをラップし, スクロール機能を追加するクラス.
 * すなわち, indexの値をscroll + offset (0 <= offset < viewCount) に分解し,
 * かつ, 直前の状態からの遷移が自然になるようにこれらの値を更新する.
 * @class
 */
Public.Scroll = class{
    #contents;
    #viewCount;

    constructor(selectObj, viewCount){
        this.#contents = selectObj;
        this.#viewCount = viewCount;
        this.initScroll();
        selectObj.bind(this);
        this.active = true;
    }

    execute(GE){
        const f = this.#contents.execute(GE);
        this.#updateScroll(this.#contents.index - this.scroll - this.offset);
        return f;
    }

    // assert:  scroll + offset == contents.index
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

    bind(other){
        this.action = (GE, index) => { other.action(GE, index) };
        this.cancel = (GE, index) => { other.cancel(GE, index) };
    }

    action(GE, index){ }
    cancel(GE, index){ }
}

})(stdtask);
