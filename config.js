/*
 * namespace config
 *
 * 今のところ config.configScene と config.SideboardDialog だけ公開
 */

var config = config || {};
(function(Public){

/**
 * cardlist.jsの内容をキャラ別に分割するクラス
 */
let Prism = class{
    static labels = PrimitiveSuits.map((e) => CharacterNames[e]).concat(["多人数"]);

    constructor(){
        this.subsets = [];
        for(let i = 0; i < Prism.labels.length; i++){
            this.subsets.push([]);
        }
        for(const data of RAW_CARD_DATA){
            const m = PrimitiveSuits.indexOf(data.suit_string);
            if(m >= 0) this.subsets[m].push(data);
            else this.subsets.at(-1).push(data);
        }
    }
}

/**
 * コンフィグで使うダイアログのベース
 */
let DialogBase = class{
    static font = "23px Sans-Serif";
    static color = "white";
    static bgColor = "rgb(0,0,0,0.8)";
    static padLeft = 50;
    static padBottom = 20;

    constructor(owner, defaultValue, x, y, w, h, footnote = null){
        this.owner = owner;
        this.result = defaultValue;
        this.footnote = footnote || "矢印キーで項目を選んで A で決定";
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.active = true;
    }

    addMod(a, b, mod){
        return (a + b + mod) % mod;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = DialogBase.bgColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.font = DialogBase.font;
        ctx.fillStyle = DialogBase.color;
        ctx.fillText(this.footnote, this.x + DialogBase.padLeft,
                                    this.y + this.height - DialogBase.padBottom);
        ctx.restore();
    }
}

/**
 * メインカード選択ダイアログ
 */
let MainCardDialog = class extends DialogBase{
    constructor(owner, defaultValue, x, y, w, h){
        super(owner, defaultValue, x, y, w, h, "← or → で項目を選んで A で決定");
        this.prism = new Prism();
        this.category = { body: Prism.labels, i: 0 };
        this.subset = null;
        this.busy = 0;
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;
        return GE.input.checkInput(
            ["ArrowLeft", "ArrowRight", "KeyA", "KeyS"],
            ["ArrowLeft", "ArrowRight"],
            this.busy
        );
    }

    draw(GE, ctx){
        super.draw(GE, ctx);
        ctx.save();
        ctx.font = DialogBase.font;
        ctx.fillStyle = DialogBase.color;

        if(!this.subset){
            ctx.fillText(`分類： 《 ${this.category.body[this.category.i]} 》`, this.x + 50, this.y+70);
        }
        else{
            const d = this.subset.body[this.subset.i];
            ctx.fillText(`分類： 　 ${this.category.body[this.category.i]}`, this.x + 50, this.y+70);
            ctx.fillText("カード：", this.x + 50, this.y+110);
            ctx.fillText(`《 ${d.id} ${d.character} 》`, this.x + 140, this.y+110);
            ctx.fillText(`HP ${d.HP}, MP ${d.MP}`, this.x + 143, this.y+150);
            if(d.main){
                ctx.fillText(`メインスキル『${d.main.name}』`, this.x + 143, this.y+190);
                ctx.fillText("　" + d.main.desc, this.x + 143, this.y + 230);
            }
        }
        ctx.restore();
    }

    execute(GE){
        const [code, k] = this.checkInput(GE);
        const target = (this.subset || this.category);
        if(k == 0 || k == 1){
            target.i = this.addMod(target.i, 2*k - 1, target.body.length);
            this.busy = 10;
        }
        if(k == 2){
            if(this.subset){
                this.result = this.subset.body[this.subset.i];
                this.active = false; // メインカード決定
            }
            else{
                const s = this.prism.subsets[this.category.i];
                if(s.length > 0){
                    this.subset = { body: s, i: 0 };
                }
                else{
                    const obj = T.finite(T.text(
                        "この分類は空です", {x: this.x + 140, y: this.y + 190, font: DialogBase.font}
                    ), 30);
                    this.owner.addSprite(obj);
                    this.owner.addTask(obj, true);
                }
            }
        }
        if(k == 3){
            if(this.subset) this.subset = null;  // 分類選択に戻る
            else this.active = false;  // キャンセルして戻る
        }
    }
}

/**
 * 選択肢を縦に並べるダイアログ。ラベルは１行だけ
 */
let SimpleChoice = class extends DialogBase{
    static step = 50;

    constructor(owner, label, options, defaultValue, x, y, w, h){
        super(owner, defaultValue, x, y, w, h, "↑ or ↓ で項目を選んで A で決定");
        this.index = defaultValue;
        this.busy = 0;
        this.label = label;
        this.options = options;
        this.active = true;
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;
        return GE.input.checkInput(
            ["ArrowUp", "ArrowDown", "KeyA", "KeyS"],
            ["ArrowUp", "ArrowDown"],
            this.busy
        );
    }

    draw(GE, ctx){
        super.draw(GE, ctx);
        ctx.save();
        ctx.font = DialogBase.font;
        ctx.fillStyle = DialogBase.color;
        ctx.fillText(this.label, this.x + 50, this.y + 70);

        const p = ctx.measureText("→ ").width;
        for(let i = 0; i < this.options.length; i++){
            const y = this.y + 120 + SimpleChoice.step * i;
            if(i == this.index){
                ctx.fillText("→ " + this.options[i], this.x + 100, y);
            }
            else{
                ctx.fillText(this.options[i], this.x + 100 + p, y);
            }
        }
        ctx.restore();
    }

    execute(GE){
        const [code, k] = this.checkInput(GE);
        if(k == 0 || k == 1){
            this.index = (1 - this.index);
            this.busy = 10;
        }
        if(k == 2){
            this.result = this.index;
            this.active = false; // 選択決定
        }
        if(k == 3){
            this.active = false;  // キャンセルして戻る
        }
    }
}

/**
 * localStorageのダイアログ。確認事項があるので別途用意する
 */
let LocalStorageDialog = class extends DialogBase{
    constructor(owner, defaultValue, x, y, w, h){
        super(owner, defaultValue, x, y, w, h, "↑ or ↓ で項目を選んで A で決定");
        this.index = (defaultValue ? 1 : 0);
        this.busy = 0;
        this.active = true;
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;
        return GE.input.checkInput(
            ["ArrowUp", "ArrowDown", "KeyA", "KeyS"],
            ["ArrowUp", "ArrowDown"],
            this.busy
        );
    }

    draw(GE, ctx){
        super.draw(GE, ctx);
        ctx.save();
        ctx.font = DialogBase.font;
        ctx.fillStyle = DialogBase.color;
        ctx.fillText("localStorageを使用しますか？", this.x + 50, this.y + 70);

        ctx.fillStyle = "orange";
        ctx.fillText("【注意】「使用しない」を選択した場合、", this.x + 45, this.y + 110);
        ctx.fillText("使用中のlocalStorageは即座に消去されます！", this.x + 50, this.y + 150);

        ctx.fillStyle = DialogBase.color;
        const p = ctx.measureText("→ ").width;
        if(this.index == 0){
            ctx.fillText("→ 使用しない", this.x + 100, this.y + 220);
            ctx.fillText("使用する", this.x + 100 + p, this.y + 270);
         }
         else{
            ctx.fillText("使用しない", this.x + 100 + p, this.y + 220);
            ctx.fillText("→ 使用する", this.x + 100, this.y + 270);
         }
        ctx.restore();
    }

    execute(GE){
        const [code, k] = this.checkInput(GE);
        if(k == 0 || k == 1){
            this.index = (1 - this.index);
            this.busy = 10;
        }
        if(k == 2){
            this.result = this.index;
            this.active = false; // 選択決定
        }
        if(k == 3){
            this.active = false;  // キャンセルして戻る
        }
    }
}

/*
 * 追加スキャンを実装するときにサイドボードのカードを選択する必要があるので、
 * このnamespaceで作っておく
 */
Public.SideboardDialog = class extends DialogBase{
    static labels = PrimitiveSuits.map((e) => CharacterNames[e]).concat(["多人数"]);

    constructor(owner, sideboardObj, defaultValue, x, y, w, h){
        super(owner, defaultValue, x, y, w, h, "← or → で項目を選んで A で決定");
        this.initPartition(sideboardObj);
        this.category = { body: Public.SideboardDialog.labels, i: 0 };
        this.subset = null;
        this.busy = 0;
    }

    // sideboardObjはDeckなので微妙に処理が違う
    initPartition(sideboardObj){
        this.subsets = [];
        for(let i = 0; i < Public.SideboardDialog.labels.length; i++){
            this.subsets.push([]);
        }
        for(const card of sideboardObj.cards){
            const m = card.mark;
            if(m < Public.SideboardDialog.labels.length - 1) this.subsets[m].push(card);
            else this.subsets.at(-1).push(card);
        }
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;
        return GE.input.checkInput(
            ["ArrowLeft", "ArrowRight", "KeyA", "KeyS"],
            ["ArrowLeft", "ArrowRight"],
            this.busy
        );
    }

    draw(GE, ctx){
        super.draw(GE, ctx);
        ctx.save();
        ctx.font = DialogBase.font;
        ctx.fillStyle = DialogBase.color;

        if(!this.subset){
            ctx.fillText(`分類： 《 ${this.category.body[this.category.i]} 》`, this.x + 50, this.y+70);
        }
        else{
            const card = this.subset.body[this.subset.i];
            ctx.fillText(`分類： 　 ${this.category.body[this.category.i]}`, this.x + 50, this.y+70);
            ctx.fillText("カード：", this.x + 50, this.y+110);
            ctx.fillText(`《 ${getCharacterName(Suits[card.mark])} ${card.value} /  MP ${card.MP} 》`, this.x + 140, this.y+110);
            if(card.skill){
                ctx.fillText(`サブスキル 『${card.skill.caption}』`, this.x + 50, this.y + 150);
                const lines = card.skill.desc.split("\n");
                for(let i = 0; i < lines.length; i++){
                    ctx.fillText(lines[i], this.x + 50, this.y + 190 + 40*i);
                }
            }
        }
        ctx.restore();
    }

    execute(GE){
        const [code, k] = this.checkInput(GE);
        const target = (this.subset || this.category);
        if(k == 0 || k == 1){
            target.i = this.addMod(target.i, 2*k - 1, target.body.length);
            this.busy = 10;
        }
        if(k == 2){
            if(this.subset){
                this.result = this.subset.body[this.subset.i];
                this.active = false; // カード決定
            }
            else{
                const s = this.subsets[this.category.i];
                if(s.length > 0){
                    this.subset = { body: s, i: 0 };
                }
                else{
                    const obj = T.finite(T.text(
                        "この分類は空です", {x: this.x + 140, y: this.y + 190, font: DialogBase.font}
                    ), 30);
                    this.owner.addSprite(obj);
                    this.owner.addTask(obj, true);
                }
            }
        }
        if(k == 3){
            if(this.subset) this.subset = null;  // 分類選択に戻る
            else this.active = false;  // キャンセルして戻る
        }
    }
}

/**
 * コンフィグ画面
 */
Public.configScene = new stdgam.Scene({
saveConfig(){
    LocalStorageInfo.saveConfig(this.setting.mainCardData.id, this.setting.chainRule);
},

displayObject: {
    x: 340,
    y: 150,
    paint(ctx, mainCard){
        ctx.save();
        ctx.strokeStyle = "rgb(255,255,255,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeRect(this.x, this.y-40, 600, 30*4+40);
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(this.x, this.y-40, 600, 30*4+40);

        ctx.fillStyle = "white";
        ctx.font = "22px Sans-Serif";
        ctx.fillText(`${mainCard.id} ${mainCard.character}`,
                     this.x + 20, this.y);
        ctx.fillText(`HP ${mainCard.HP},  MP ${mainCard.MP}`,
                     this.x + 20, this.y+30);
        if(mainCard.main){
            ctx.fillText(`メインスキル 『${mainCard.main.name}』`, this.x + 20, this.y + 60);
            ctx.fillText("　" + mainCard.main.desc, this.x + 20, this.y + 90);
        }
        ctx.restore();
    }
},

checkInput(GE){
    if(this.busy > 0) this.busy--;
    return GE.input.checkInput(
        ["ArrowUp", "ArrowDown", "KeyA", "KeyS"],
        ["ArrowUp", "ArrowDown"],
        this.busy
    );
},

onLoad(GE, setting){
    this.setting = setting;
    this.deck = setting.deckSet.cards;  // localStorageを使うとき、すぐに保存するため必要

    this.add(T.image(GE.caches.get("BACKGROUND"), {x: 0, y: 0}));
    this.add(T.text("メインカードを変更する", {x: 90, y:90, font: "32px Sans-Serif"}));
    this.add(T.text("現在の設定：", {x: 160, y:133, font: "24px Sans-Serif"}));

    this.add(T.text("localStorageの設定を変更する", {x: 90, y:330, font: "32px Sans-Serif"}));

    let tmp = T.text("現在の設定：  ", {x: 160, y:373, font: "24px Sans-Serif"});
    tmp.execute = (GE) => {
        tmp.text = LocalStorageInfo.isUsed() ? "現在の設定：　使用する" : "現在の設定：　使用しない";
        return true;
    };
    this.add(tmp);

    this.add(T.text("コンボ成立条件の設定を変更する", {x: 90, y:510, font: "32px Sans-Serif"}));
    this.add(T.ftext("現在の設定：  第${}弾ルール", this.setting, "chainRule", {x: 160, y:553, font: "24px Sans-Serif"}));

    this.index = 0;
    this.busy = 0;
    this.itemY = [ 90, 330, 510 ];

    const mainCardView = {
        owner: this,
        draw(GE, ctx){ this.owner.displayObject.paint(ctx, this.owner.setting.mainCardData); }
    };
    this.add(mainCardView);
},

operations: [
    { createDialog: (owner) => {
          return new MainCardDialog(owner, owner.setting.mainCardData, 200, 140, 600, 420);
      },
      treatResult: (owner, result) => {
          owner.setting.mainCardData = result;
          if(LocalStorageInfo.isUsed()){
              owner.saveConfig();
          }
      }
    },
    { createDialog: (owner) => {
          return new LocalStorageDialog(owner, LocalStorageInfo.isUsed() ? 1 : 0, 200, 140, 600, 420);
      },
      treatResult: (owner, result) => {
          if(result == 1){
              owner.saveConfig();
              LocalStorageInfo.saveDeck(owner.deck);
          }
          else if(LocalStorageInfo.isUsed()){
              LocalStorageInfo.removeStorage();
          }
      }
    },
    { createDialog: (owner) => {
          const options = ["第1弾ルール", "第2弾ルール"];
          return new SimpleChoice(owner, "コンボ成立条件", options,
                                     owner.setting.chainRule-1, 200, 140, 600, 420);
      },
      treatResult: (owner, result) => {
          owner.setting.chainRule = result + 1;
          if(LocalStorageInfo.isUsed()){
              owner.saveConfig();
          }
      }
    }
],

draw(GE, ctx){
    ctx.save();
    ctx.font = "32px Sans-Serif";
    ctx.fillStyle = "white";
    ctx.fillText("→ ", 50, this.itemY[this.index]);
    ctx.restore();
},

execute(GE){
    if(this.dialog && this.dialog.active) return;
    if(this.dialog){
        const r = this.dialog.result;
        this.operations[this.index].treatResult(this, r);
        this.dialog = null;
    }
    else{
        const [code, k] = this.checkInput(GE);
        if(k == 0){
            this.index = (this.index + this.itemY.length - 1) % this.itemY.length;
            this.busy = 10;
        }
        if(k == 1){
            this.index = (this.index + 1) % this.itemY.length;
            this.busy = 10;
        }
        if(k == 2){
            this.dialog = this.operations[this.index].createDialog(this);
            this.addSprite(this.dialog);
            this.addTask(this.dialog, true);
            this.busy = 10;
        }
        else if(k == 3){
            GE.changeScene("select");
        }
    }
}

});

})(config);
