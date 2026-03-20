

class QBTalk{
    constructor(msg, frames = 120){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.activate(msg, frames);
    }

    activate(msg, frames = 120){
        this._y = this.y
        this.frames = frames;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this, this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        const result = this.iter.next();
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; yield true; }
        for(i = 0; i < this.frames; i++) yield true;
        for(i = 0; i < 20; i++){ this._y += this.a; yield true; }
    }
}


class QBTelop{
    constructor(msg, frames = 20){
        this.a = (1 / 15);
        this.step = 40;
        this.activate(msg, frames);
    }

    activate(msg, frames = 20){
        this._alpha = 0;
        this.frames = frames;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.globalAlpha = Math.max(this._alpha, 0);
        ctx.fillStyle = "white";
        ctx.font = "32px Sans-Serif";
        ctx.textAlign = "center";
        const y = 350 - this.lines.length * this.step/2;
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 500, y + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        const result = this.iter.next(this);
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 15; i++){ this._alpha += this.a; yield true; }
        for(i = 0; i < this.frames; i++) yield true;
        for(i = 0; i < 15; i++){ this._alpha -= this.a; yield true; }
    }
}


class QBYesNo{
    constructor(msg, minWait = 20, seName = null){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.seName = seName;
        this.activate(msg, minWait);
    }

    activate(msg, minWait = 20){
        this._y = this.y
        this.busy = minWait;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this, this);
        this.result = false;
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        this.GE = GE;
        const result = this.iter.next();
        this.GE = null;
        if(result.done) this.active = false;
        return false;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; this.busy--; yield false; }
        yield* this.waitForAnswer();
        for(i = 0; i < 20; i++){ this._y += this.a; yield false; }
    }

    *waitForAnswer(){
        let f = true;
        while(f){
            const codes = ["KeyA", "KeyS"];
            const i = codes.findIndex((e) => this.GE.input.isJustPressed(e));
            if(this.busy > 0) this.busy--;
            else{
                if(i >= 0){
                    this.result = (i == 0);
                    if(this.seName && this.result) this.GE.se.play(this.seName);
                    f = false;
                }
            }
            yield false;
        }
    }
}


class QBLecture{
    constructor(msgs, minWait=20){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.activate(msgs, minWait);
    }

    activate(msgs, minWait=30){
        this._y = this.y
        this.messages = [...msgs];
        this.lines = [];
        this.minWait = minWait;
        this.busy = 0;

        this.iter = this.chart.call(this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        if(this._y <= this.y - this.a*20){
            ctx.font = "20px Sans-Serif";
            ctx.fillText("▼NEXT", 850, 660);
        }
        ctx.restore();
    }

    execute(GE){
        this.GE = GE;
        const result = this.iter.next();
        this.GE = null;
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; yield true; }
        yield* this.talk();
        for(i = 0; i < 20; i++){ this._y += this.a; yield true; }
    }

    *talk(){
        while(this.nextPage()){
            let f = true;
            while(f){
                const codes = ["KeyA", "KeyS", "KeyD"];
                const i = codes.findIndex((e) => this.GE.input.isJustPressed(e));
                if(this.busy > 0) this.busy--;
                if(this.busy == 0 && i >= 0) f = false;
                yield true;
            }
        }
    }

    nextPage(){
        if(this.messages.length == 0) return false;
        const msg = this.messages.shift();
        this.lines = msg.split("\n");
        this.busy = this.minWait;
        return true;
    }
}


// QBのセリフをなるべく分散させないために
// (短い＆分岐が無いものはそのまま埋め込まれているけど)

const createOpeningQB = function(battleOpt){
    // チュートリアルの場合
    if(battleOpt.tutorial){
        return new QBLecture(battleOpt.tutorial);
    }

    // 予行練習の場合
    if(!battleOpt.enemyData){
        const s = "まずは予行練習から始めよう。カードの順番をよく覚えてね。";
        return new QBTalk(s);
    }

    const affinity = battleOpt.enemyData.affinity;

    // 通常の場合
    if(!battleOpt.playerData || !affinity[battleOpt.playerData.suit_string]){
        const s = "いよいよバトル開始だよ。\nがんばって。";
        return new QBTalk(s);
    }

    // 相性が有利 or 不利の場合
    if(affinity[battleOpt.playerData.suit_string] > 0){
        const s = "相性バッチリみたいだね。\nがんばって。";
        return new QBTalk(s);
    }
    else{
        const s = "あまり相性が良くないみたいだね。\n気を付けて。";
        return new QBTalk(s);
    }
}

const createConfirmatingQB_BeforeBattle = function(setting){
    const usedCards = setting.deckSet.cards;
    const sideboardCards = setting.sideboardSet.cards;
    const mainCard = CardAtlas.get(setting.mainCardData.id);

    let msg;
    if(usedCards.indexOf(mainCard) >= 0){
        msg = "メインカードに指定されたカードは、バトルの間デッキから\n取り除かれるよ。それでも構わないかい？\nA → YES    S → No";
    }
    else {
        msg = "バトルを開始するかい？\nA → YES    S → No";
    }

    return new QBYesNo(msg, 20, "optionSelected");
}
