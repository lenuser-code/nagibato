/*
 * editの定義
 */

/*
 * namespace battle
 *
 * 公開されるの edit.editScene のみ（今のところ）
 */
var edit = edit || {};
(function(Public){

let CardCapture = class{
    constructor(owner, colCount, x, y, dp){
        this.owner = owner;
        this.colCount = colCount;
        this.x = x;
        this.y = y;
        this.scroll = 0;
        this.c = 0;
        this.busy = 0;
        this.descPainter = dp;
        this.active = true;
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;

        const codes = ["ArrowLeft", "ArrowRight", "KeyA", "KeyS"];
        const i = codes.findIndex((e) => GE.input.isJustPressed(e));
        if(i >= 0) return i;

        if(this.busy == 0){
            const codes = ["ArrowLeft", "ArrowRight"];
            return codes.findIndex((e) => GE.input.isDown(e));
        }
    }

    selectedIndex(){
        return this.scroll + this.c;
    }

    recalculatePosition(){
        while(this.selectedIndex() >= this.owner.cardCount()){
            if(this.c > 0) this.c--;
            else this.scroll--;
        }
    }

    draw(GE, ctx){
        if(this.active){
            ctx.save();
            const x = this.x - 10 + this.c*Card.width*1.3;
            const y = this.y - 10;
            ctx.strokeStyle = "rgba(255,130,130,0.6)";
            ctx.lineWidth = 10;
            ctx.strokeRect(x, y, Card.width + 20, Card.height + 20);
            ctx.fillStyle = "white";

            if(this.descPainter){
                const card = this.owner.watch(this.selectedIndex());
                this.descPainter.paint(ctx, card);
            }
            ctx.restore();
        }
    }

    execute(GE){
        const k = this.checkInput(GE);
        if(k == 0){
            if(this.c > 0) this.c--;
            else if(this.scroll > 0) this.scroll--;
            this.busy = 10;
        }
        if(k == 1){
            if(this.selectedIndex() < this.owner.cardCount() - 1){
                if(this.c < this.colCount-1) this.c++;
                else this.scroll++;
                this.busy = 10;
            }
        }
        if(k == 2){
            this.owner.action();
        }
        if(k == 3){
            this.owner.cancel();
        }
        return false;
    }
}

let CardPanel = class{
    constructor(owner, deckSet, colCount, x, y, showAlways = true){
        this.owner = owner;
        this.deckSet = deckSet;
        this.colCount = colCount;
        this.x = x;
        this.y = y;
        this.capture = false;
        this.showAlways = showAlways;
        this.active = true;
    }

    cardCount(){
        return this.deckSet.size();
    }

    watch(index){
        return this.deckSet.watch(index);
    }

    isCaptureMode(){
        return !(!this.capture);
    }

    changeDeck(deckSet){
        if(!this.isCaptureMode()){
            this.deckSet = deckSet;
        }
    }

    beginCaptureMode(dp){
        if(this.deckSet.size() == 0 || this.capture){
            return false;
        }
        else{
            this.capture = new CardCapture(this, this.colCount, this.x, this.y, dp);
            this.owner.addSprite(this.capture);
            this.owner.addTask(this.capture, true);
            return true;
        }
    }

    action(){
        const index = this.capture.selectedIndex();
        const card = this.deckSet.slice(index);
        this.owner.cardPicked(this, card);
        if(this.deckSet.size() == 0){
            this.cancel();
        }
        else{
            this.capture.recalculatePosition();
        }
    }

    cancel(){
        this.capture.active = false;
        this.capture = null;
    }

    draw(GE, ctx){
        if(!this.showAlways && !this.isCaptureMode()) return;
        ctx.save();
        const w = Card.width*this.colCount*1.3-Card.width*0.3+40;
        ctx.strokeStyle = "rgb(0,20,70,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeRect(this.x-20, this.y-20, w, Card.height+40);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x-20, this.y-20, w, Card.height+40);
        const scroll = this.capture ? this.capture.scroll : 0;
        if(this.deckSet.size() == 0){
            ctx.fillStyle = "white";
            ctx.font = "27px Sans-Serif";
            ctx.fillText("カードがありません", this.x, this.y + 20);
        }
        else{
            for(let i = 0; i < this.colCount; i++){
                const x = this.x + i*Card.width*1.3;
                const y = this.y;
                const card = this.deckSet.watch(scroll + i);
                card.paint(GE, ctx, x, y);
            }
        }
        ctx.restore();
    }
}

let CardCapture2D = class{
    constructor(owner, rowCount, colCount, x, y, dp){
        this.owner = owner;
        this.rowCount = rowCount;
        this.colCount = colCount;
        this.x = x;
        this.y = y;
        this.scroll = 0;
        this.r = 0;
        this.c = 0;
        this.busy = 0;
        this.descPainter = dp;
        this.active = true;
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;

        const codes = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyA", "KeyS"];
        const i = codes.findIndex((e) => GE.input.isJustPressed(e));
        if(i >= 0) return i;

        if(this.busy == 0){
            const codes = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            return codes.findIndex((e) => GE.input.isDown(e));
        }
    }

    selectedIndex(){
        return (this.r + this.scroll) * this.colCount + this.c;
    }

    inLastRow(){
        return (this.r + this.scroll + 1) * this.colCount >= this.owner.cardCount();
    }

    recalculatePosition(){
        while(this.selectedIndex() >= this.owner.cardCount()){
            if(this.c > 0) this.c--;
            else if(this.r > 0){
                this.r--;
                this.c = this.colCount - 1;
            }
            else{
                this.scroll--;
                this.c = this.colCount - 1;
            }
        }
    }

    draw(GE, ctx){
        if(this.active){
            ctx.save();
            const x = this.x - 10 + this.c*Card.width*1.3;
            const y = this.y - 10 + this.r*Card.height*1.2;
            ctx.strokeStyle = "rgba(255,130,130,0.6)";
            ctx.lineWidth = 10;
            ctx.strokeRect(x, y, Card.width + 20, Card.height + 20);
            ctx.fillStyle = "white";

            if(this.descPainter){
                const card = this.owner.watch(this.selectedIndex());
                this.descPainter.paint(ctx, card);
            }
            ctx.restore();
        }
    }

    execute(GE){
        const k = this.checkInput(GE);
        if(k == 0){
            if(this.r > 0) this.r--;
            else if(this.scroll > 0) this.scroll--;
            this.busy = 10;
        }
        if(k == 1){
            if(this.inLastRow()) return false;
            if(this.r < this.rowCount - 1) this.r++;
            else this.scroll++;
            this.recalculatePosition();
            this.busy = 10;
        }
        if(k ==  2){
            if(this.selectedIndex() == 0) return false;
            if(this.c > 0) this.c--;
            else{
                this.c = this.colCount - 1;
                if(this.r > 0) this.r--;
                else this.scroll--;
            }
            this.busy = 10;
        }
        if(k == 3){
            if(this.selectedIndex() == this.owner.cardCount() - 1) return false;
            if(this.c < this.colCount - 1) this.c++;
            else{
                this.c = 0;
                if(this.r < this.rowCount - 1) this.r++;
                else this.scroll++;
            }
            this.busy = 10;
        }
        if(k == 4){
            this.owner.action();
        }
        if(k == 5){
            this.owner.cancel();
        }
        return false;
    }
}

let CardPanel2D = class{
    constructor(owner, deckSet, rowCount, colCount, x, y){
        this.owner = owner;
        this.deckSet = deckSet;
        this.rowCount = rowCount;
        this.colCount = colCount;
        this.x = x;
        this.y = y;
        this.capture = false;
        this.active = true;
    }

    cardCount(){
        return this.deckSet.size();
    }

    watch(index){
        return this.deckSet.watch(index);
    }

    isCaptureMode(){
        return !(!this.capture);
    }

    changeDeck(deckSet){
        if(!this.isCaptureMode()){
            this.deckSet = deckSet;
        }
    }

    beginCaptureMode(dp){
        if(this.deckSet.size() == 0 || this.capture){
            return false;
        }
        else{
            this.capture = new CardCapture2D(this, this.rowCount, this.colCount,
                                             this.x, this.y, dp);
            this.owner.addSprite(this.capture);
            this.owner.addTask(this.capture, true);
            return true;
        }
    }

    action(){
        const index = this.capture.selectedIndex();
        const card = this.deckSet.slice(index);
        this.owner.cardPicked(this, card);
        if(this.deckSet.size() == 0){
            this.cancel();
        }
        else{
            this.capture.recalculatePosition();
        }
    }

    cancel(){
        this.capture.active = false;
        this.capture = null;
    }

    draw(GE, ctx){
        ctx.save();
        const w = Card.width*this.colCount*1.3-Card.width*0.3+40;
        const h = Card.height*this.rowCount*1.2-Card.height*0.2+40;
        ctx.strokeStyle = "rgb(0,20,70,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeRect(this.x-20, this.y-20, w, h);
        ctx.fillcStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x-20, this.y-20, w, h);
        if(this.deckSet.size() == 0){
            ctx.fillStyle = "white";
            ctx.font = "27px Sans-Serif";
            ctx.fillText("カードがありません", this.x + 0, this.y + 20);
        }
        else{
            const scroll = this.capture ? this.capture.scroll : 0;
            for(let i = 0; i < this.rowCount; i++){
                for(let j = 0; j < this.colCount; j++){
                    const x = this.x + j*Card.width*1.3;
                    const y = this.y + i*Card.height*1.2;
                    const card = this.deckSet.watch((scroll + i) * this.colCount + j);
                    card.paint(GE, ctx, x, y);
                }
            }
        }
        ctx.restore();
    }
}


let MenuDialog = class{
    // optで指定できるもの: padding, step, font
    constructor(menu, x, y, innerWidth, innerHeight, opt = {}){
        this.menu = menu;
        this.index = 0;
        this.x = x;
        this.y = y;
        this.padding = opt.padding || 20;
        this.step = opt.step || 40;
        this.font = opt.font || "22px Sans-Serif";
        this.width = innerWidth + this.padding * 2;
        this.height = innerHeight + this.padding * 2;
        this.busy = 0;
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.strokeStyle = "rgb(0,20,70,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.font = this.font;

        const m = ctx.measureText("→_");
        const ax = this.x + this.padding;
        const ay = this.y + this.padding + m.fontBoundingBoxAscent + this.step*this.index;
        const aw = m.width;
        ctx.fillText("→", ax, ay);

        const px = ax + aw;
        const py = this.y + this.padding + m.fontBoundingBoxAscent;
        for(let i = 0; i < this.menu.length; i++){
            ctx.fillText(this.menu[i], px, py + this.step*i);
        }
        ctx.restore();
    }

    checkInput(GE){
        if(this.busy > 0) this.busy--;

        const codes = ["ArrowUp", "ArrowDown", "KeyA", "KeyS"];
        const i = codes.findIndex((e) => GE.input.isJustPressed(e));
        if(i >= 0) return i;

        if(this.busy == 0){
            const codes = ["ArrowUp", "ArrowDown"];
            return codes.findIndex((e) => GE.input.isDown(e));
        }
    }

    execute(GE){
        const i = this.checkInput(GE);
        if(i == 0){
            this.index = (this.index + this.menu.length - 1) % this.menu.length;
            this.onChange(GE, this.index);
            this.busy = 10;
        }
        if(i == 1){
            this.index = (this.index + 1) % this.menu.length;
            this.onChange(GE, this.index);
            this.busy = 10;
        }
        if(i == 2){ this.action(GE, this.index); this.busy = 10; }
        if(i == 3){ this.cancel(GE, this.index); this.busy = 10; }
        return false;
    }

    onChange(GE, n){ }
    action(GE, n){ }
    cancel(GE, n){ }
}

let Prism = class{
    static labels = [
        "まどか", "ほむら", "さやか", "マミ", "杏子", "なぎさ", "多人数"
    ];

    constructor(source){
        const tmp = [];
        for(let i = 0; i < Prism.labels.length; i++){
            tmp.push([]);
        }
        source.cards.forEach((e) => {
            if(e.mark < tmp.length - 1) tmp[e.mark].push(e);
            else tmp[tmp.length-1].push(e);
        });
        this.subsets = tmp.map((subset) => new CardSet(subset));
    }

    size(){
        return this.subsets.length;
    }

    union(){
        const a = [];
        for(let i = 0; i < this.subsets.length; i++){
            a.push(...this.subsets[i].cards);
        }
        return a;
    }
}

const displayObject = {
    y: 400,
    prevDesc: null,
    lines: null,

    setPosition(i){
        this.x = 320;
        this.y = 400 + 100*i;
    },
    paint(ctx, card){
        ctx.save();
        ctx.strokeStyle = "rgb(255,255,255,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeRect(this.x, this.y-40, 600, 30*4+20);
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(this.x, this.y-40, 600, 30*4+20);

        ctx.fillStyle = "white";
        ctx.font = "22px Sans-Serif";
        ctx.fillText(`${getCharacterName(Suits[card.mark])} ${card.value} /  MP ${card.MP}`,
                     this.x + 20, this.y);
        if(card.skill){
            ctx.fillText(`サブスキル 『${card.skill.caption}』`, this.x + 20, this.y + 30);
            if(!this.lines || this.prevDesc != card.skill.desc){
                this.lines = card.skill.desc.split("\n");
                this.prevDesc = card.skill.desc;
            }
            for(let i = 0; i < this.lines.length; i++){
                ctx.fillText(this.lines[i], this.x + 20, this.y + 30*(i+2));
            }
        }
        ctx.restore();
    }
};

let createBaseMenu = function(owner, panels){
    panels[0].changeDeck(owner.prisms[0].subsets[0]);
    panels[1].changeDeck(owner.prisms[1].subsets[0]);
    const obj = new MenuDialog(Prism.labels, 60, 30, 200, 40*owner.prisms[0].size());
    obj.action = (GE, n) => {
        const sub = new MenuDialog(["カードを増やす", "カードを減らす"], 60, 60, 200, 80);
        sub.action = (GE, n) => {
            displayObject.setPosition(n);
            panels[1-n].beginCaptureMode(displayObject);
        }
        sub.cancel = (GE, n) => { sub.active = false; }
        owner.addSprite(sub);
        owner.addTask(sub, true);
    };
    obj.cancel = (GE, n) => {
        owner.used.init(owner.prisms[0].union());
        owner.notUsed.init(owner.prisms[1].union());
        if(LocalStorageInfo.isUsed()){
            LocalStorageInfo.saveDeck(owner.used.cards);
        }
        GE.changeScene("select");
    };
    obj.onChange = (GE, n) => {
        panels[0].changeDeck(owner.prisms[0].subsets[n]);
        panels[1].changeDeck(owner.prisms[1].subsets[n]);
    };
    return obj;
}

Public.editScene = new stdgam.Scene({
onLoad(GE, args){
    this.add(T.image(GE.caches.get("BACKGROUND"), {x: 0, y: 0}));
    this.used = args.set1;
    this.notUsed = args.set2;
    this.prisms = [new Prism(this.used), new Prism(this.notUsed)];

    this.panel1 = new CardPanel2D(this, this.used, 3, 5, 330, 50);
    this.panel2 = new CardPanel(this, this.notUsed, 7, 90, 520, false);
    this.add(this.panel1);
    this.add(this.panel2);

    this.menu = createBaseMenu(this, [this.panel1, this.panel2], this.prisms);
    this.addSprite(this.menu);
    this.addTask(this.menu, true);
},

cardPicked(panel, card){
    const i = this.menu.index;
    if(panel == this.panel1) this.prisms[1].subsets[i].push(card);
    else this.prisms[0].subsets[i].push(card);
}
});

})(edit);
