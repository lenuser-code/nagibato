/**
 * @file
 * namespace stdgamの定義と, ZzFXのZzFX Micro Codeのインポートを行う.
 *
 * ZzFX - Zuper Zmall Zound Zynth (by Frank Force)
 * https://github.com/KilledByAPixel/ZzFX?tab=readme-ov-file
 *
 * stdgamの実装が主要な作業内容だが, 他に適切な方法がなかったので
 * ZzFX Micro Codeもこのファイルに記述する.
 *
 * @author lenuser
 */

//--- 最初にnamespace stdgamを定義する

/**
 * ゲームエンジンの実装を行うnamespace. 以下の要素が外部に公開される.
 * - stdgam.GameEngine
 * - stdgam.Scene
 * - stdgam.CachePool
 * - stdgam.ImagePool
 * - stdgam.SoundPool
 * - stdgam.SEPool
 * - stdgam.Templates
 */
var stdgam = stdgam || {};
(function(Public){

// #1. Sceneの実装

/**
 * ゲームにおける１つのモード, または１つのステージを表すクラス.
 * GameEndineからロードして使う.
 * @class
 */
Public.Scene = class {
    /**
     * dfnが渡された場合、共通の処理を済ませた後にその内容を自身に代入する.
     * これにより, 派生クラスを作らなくても, dfnの中に追加の定義を書いておけば
     * それを自身に適用できる.
     *
     * 例)
     * let scene = new stdgam.Scene({
     *     onLoad(GE, args){ ...初期化処理... },
     *     draw(GE, ctx){ ,,,描画処理... } }
     * });
     *
     * 上の例は次と等価である:
     * let scene = new stdgam.Scene();
     * scene.onLoad = function(GE, args){ ...初期化処理... };
     * scene.draw(GE, ctx) = function{ ...描画処理... };
     *
     * @param {Object.<string,*>} dfn - このオブジェクトに追加で定義する
     * 要素を集めた連想配列.
     */
    constructor(dfn = {}){
        this.init();
        this.GE = null;
        Object.assign(this, dfn);
    }

    // このシーンがGEのカレントシーンになったとき呼び出される
    superOnLoad(GE, args){
        this.GE = GE;
        if(this.onLoad) this.onLoad(GE, args);
    }

    // スプライトとタスクのリストを初期化する
    init(){
        this.sprites = [];
        this.tasks = [];
    }

    // スプライトを追加する.
    // もし第2引数にtrueを指定した場合は先頭に追加する
    addSprite(spr, first = false){
        if(first){
            this.sprites.unshift(spr);
        }
        else{
            this.sprites.push(spr);
        }
    }

    addSpriteBefore(target, ...objs) {
        const i = this.sprites.indexOf(target);
        if (i >= 0) this.sprites.splice(i, 0, ...objs);
        else this.sprites.unshift(...objs); // 見つからなければ先頭へ
    }

    addSpriteAfter(target, ...objs) {
        const i = this.sprites.indexOf(target);
        if (i >= 0) this.sprites.splice(i + 1, 0, ...objs);
        else this.sprites.push(...objs); // 見つからなければ末尾へ
    }

    // タスクを追加する.
    // もし第2引数にtrueを指定した場合は先頭に追加する.
    addTask(task, first = false){
        if(first){
            this.tasks.unshift(task);
        }
        else{
            this.tasks.push(task);
        }
    }

    addTaskBefore(target, ...objs) {
        const i = this.tasks.indexOf(target);
        if (i >= 0) this.tasks.splice(i, 0, ...objs);
        else this.tasks.unshift(...objs); // 見つからなければ先頭へ
    }

    addTaskAfter(target, ...objs) {
        const i = this.tasks.indexOf(target);
        if (i >= 0) this.tasks.splice(i + 1, 0, ...objs);
        else this.tasks.push(...objs); // 見つからなければ末尾へ
    }

    // スプライトとタスクを同時に登録するショートカット
    add(obj, first = false){
        if (obj.draw) this.addSprite(obj, first);
        if (obj.execute) this.addTask(obj, first);
        return obj;
    }

    // 複数のオブジェクトを登録するためのショートカット.
    // 先頭に追加する場合, リスト内の順序を維持したままリストの先頭に連結する.
    // 末尾に追加する場合は単にaddを繰り返すのと同じである.
    addSequence(list, first = false) {
        if (first) {
            const sprites = list.filter(e => e.draw);
            const tasks = list.filter(e => e.execute);
            this.sprites = [...sprites, ...this.sprites];
            this.tasks = [...tasks, ...this.tasks];
        } else {
            list.forEach(e => this.add(e));
        }
        return list;
    }

    // 登録されているスプライトのdraw(GE, ctx)を順番に実行する.
    // ここでGEはこのゲームのGameEngine, ctxは描画に使うコンテクストである.
    // 最後に「activeが真」または「activeがundefined」のスプライトだけを
    // リストに残して, 他のスプライトはリストから削除する.
    superdraw(ctx){
        this.sprites.forEach(e => e.draw(this.GE, ctx));
        this.sprites = this.sprites.filter(e => (e.active || e.active === undefined));
        if(this.draw) this.draw(this.GE, ctx);
    }

    // 登録されているタスクのexecute(GE)を順番に実行する.
    // ここでGEはこのゲームのGameEngineである.
    // ただし, あるタスクがfalseを返した場合, それより後のタスクは実行しない
    // 
    // スプライトの場合と同様, 最後に「activeが真」または「activeがundefined」の
    // タスクだけをリストに残して, 他のタスクはリストから削除する.
    // 
    // 【注意】execute()の中でタスクの追加・削除を行うと, for文の実行中に
    // 配列を変更したのと同じ現象が発生します！　特に、自身よりも前に新しい要素を、
    // 追加する場合は, falseを返して後続の処理を止めてください.
    superexecute(){
        let i, f;
        for(i = 0, f = true; i < this.tasks.length && f; i++){
            const task = this.tasks[i];
            f = task.execute(this.GE);
            if(task._traits){
                for(let trait of task._traits){
                    trait.call(task, this.GE);
                }
            }
        }
        this.tasks = this.tasks.filter(e => (e.active || e.active === undefined));
        if(this.execute) this.execute(this.GE);
    }

    /**
     * 指定されたジェネレータ関数を使ってジェネレータを作り, このオブジェクトの
     * 更新処理をこのジェネレータに委任する.
     * 具体的には, このジェネレータを実行するだけの関数をthis.executeに代入する.
     * ジェネレータが完了したときは, このメソッドを実行する直前のexecuteの値に戻す.
     * @param {GameEngine} GE - ジェネレータ関数の初期化時に渡すGameEngine
     * @param {GeneratorFunction} gen - 処理を委任するジェネレータ関数
     * @param {Object.<*,*>} [opt={}] - ジェネレータ関数の初期化時に渡すオプション
     */
    useCoroutine(GE, gen, opt = {}){
        const iter = gen.call(this, GE, opt);
        const backup = this.execute;
        this.execute = (GE) => {
            const result = iter.next();
            if(result.done) this.execute = backup;
        };
    }
}


// #2. GameEngineの実装

/**
 * キー入力を管理するヘルパークラス.
 * クラス定義自体は公開されないが, インスタンスはGameEngineのinput要素に格納され
 * 外部からも利用される.
 * @class
 */
let InputManager = class {
    constructor(){
        this.currentKeys = new Set();
        this.previousKeys = new Set();
        window.addEventListener('keydown', (e) => this.currentKeys.add(e.code));
        window.addEventListener('keyup', (e) => this.currentKeys.delete(e.code));
        window.addEventListener('blur', () => this.currentKeys.clear());
    }

    // 現在の状態を「1フレーム前の状態」としてコピー
    update() {
        this.previousKeys = new Set(this.currentKeys);
    }

    // そのキーが今押されているか？
    isDown(code) {
        return this.currentKeys.has(code);
    }

    // 「今は押されている」かつ「1フレーム前は押されていなかった」ときtrueを返す
    isJustPressed(code) {
        return this.currentKeys.has(code) && !this.previousKeys.has(code);
    }

    // シーン切り替え時に「今押されているキー」を「前から押されていたこと」にする.
    // これにより, 新しいシーンで isJustPressed が false になる
    sync() {
        this.previousKeys = new Set(this.currentKeys);
    }

    // キー入力のチェックを補佐する関数.
    // キーを押し続けたときに毎フレーム反応するのでは困るが,
    // 一定の間隔が空いていればキーを離していなくてもキー入力を受け付けたい、
    // というケースに用いる.
    //
    // (1) もし codes1 の中に isJustPressed が真のものがあれば,
    //     そのような一番最初のキー入力とそのインデックスの組を返す.
    // (2) さらに、(1)に該当するものが無く, かつbusyFlagが偽のとき
    //     codes2 の中で isDown が真である最初のキーを探す.
    //     見つかればそのキーとインデックスの組を返す.
    // (3) 上記のどちらにも該当しないとき, [null, -1]を返す.
    checkInput(codes1, codes2 = null, busyFlag = true){
        let i = codes1.findIndex((e) => this.isJustPressed(e));
        if(i >= 0) return [ codes1[i], i ];

        if(codes2 && !busyFlag){
            i = codes2.findIndex((e) => this.isDown(e));
            if(i >= 0) return [ codes2[i], i ];
        }

        return [ null, -1 ];
    }
}

/**
 * タイマー処理を担当するヘルパークラス.
 * @class
 */
let TimeKeeper = class {
    constructor(owner){
        this.owner = owner;
        this.isRunning = false;
        this.fps = 60; // ターゲットfps
    }

    // タイマー処理を開始する
    run(){
        if(this.isRunning) return;
        this.isRunning = true;

        const interval = 1000 / this.fps; // 1フレームあたりのミリ秒（約16.6ms）
        let lastTime = performance.now();

        const loop = (currentTime) => {
           const elapsed = currentTime - lastTime;
           // 指定した間隔（16.6ms）以上が経過したかチェック
           if (elapsed >= interval) {
               lastTime = currentTime - (elapsed % interval);
               this.owner.update();
           }
           requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

/**
 * ゲームの全体的な挙動を管理するクラス.
 * @class
 */
Public.GameEngine = class {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scenes = {};
        this.currentScene = null;

        this.input = new InputManager();
        this.timer = new TimeKeeper(this);
        this.se = new Public.SEPool();
        this.images = new Public.ImagePool();
        this.sounds = new Public.SoundPool();
        this.caches = new Public.CachePool();
    }

    // ゲームの実行を開始する
    run(){
        this.timer.run();
    }

    // nameという名前で指定されたシーンを登録する
    addScene(name, scene) {
        this.scenes[name] = scene;
    }

    // nameという名前で登録されているシーンをカレントシーンとする.
    // 第２引数としてハッシュを指定した場合, これをカレントシーンに伝える
    changeScene(name, data = {}) {
        this.input.sync();
        if(this.scenes[name]){
            this.currentScene = this.scenes[name];
            this.currentScene.superOnLoad(this, data);
        }
    }

    // カレントシーンに１フレーム分の処理を実行させる
    update(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.currentScene){
            this.currentScene.superexecute();
            this.currentScene.superdraw(this.ctx);
        }

        this.input.update();
    }

    // 画像・音声のロードを待ってからcallbackを実行する
    async ready(callback){
        this.images.ready().then(() => {
            this.sounds.ready().then(callback);
        });
    }
}


// #3. 画像・音声の管理をサポートする機能

/**
 * イメージを指定された幅・高さに基づいて分割するクラス.
 * @class
 */
Public.ImageCutter = class {
    constructor(img, width, height){
        this.img = img;
        this.w = width;  // 1コマの横幅
        this.h = height; // 1コマの縦幅
    }

    // 分割した画像のうち上からa番目, 左からb番目の部分を描画する.
    // ただし, a, bは0から数え始めるものとする
    paint(ctx, x, y, a, b){
        const sx = this.w * a;
        const sy = this.h * b;
        ctx.drawImage(
            this.img, sx, sy, this.w, this.h,
            x, y, this.w, this.h
        );
    }
}

/**
 * オフスクリーン・キャンバスを管理するクラス.
 * @class
 */
Public.CachePool = class {
    constructor(){
        this.pool = {};
    }

    // オフスクリーン・キャンバスを作ってプールに登録する.
    // (drawFnが与えられた場合, それを実行する)
    createCache(name, w, h, drawFn = (ctx) => {}){
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        drawFn(c.getContext('2d'));
        this.pool[name] = c;
        return c;
    }

    // プールに登録されているキャンバスを返す
    get(name){
        return this.pool[name];
    }
}

/**
 * 画像ファイルから読み込んだイメージを管理するクラス.
 * @class
 */
Public.ImagePool = class {
    constructor(){
        this.pool = {};
        this.promises = []; // ロード状態を追跡するリスト
    }

    // 画像を読み込み、それをプールに登録する。
    // 返却値は画像のロード待ちを行なっているPromiseオブジェクト
    load(name, url){
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${url}`));
            img.src = url;
            this.pool[name] = img;
        });
        this.promises.push(promise);
        return promise;
    }

    // 全ての画像が揃うまで待機するためのPromise
    ready() {
        return Promise.all(this.promises);
    }

    // 登録されている画像を返す
    get(name){
        return this.pool[name];
    }
}

/**
 * 音声ファイルを管理するクラス.
 * [注意] 現在のブラウザでは、ユーザがそのページ内で何か操作をするまで
 * 勝手に音声を鳴らすことができない！
 * @class
 */
Public.SoundPool = class {
    constructor() {
        this.pool = {};
        this.promises = [];
    }

    // 音声ファイルをロードして、それをプールに登録する。
    // 返却値はロード待ちを行なっているPromiseオブジェクト
    load(name, url) {
        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
            audio.src = url;
            this.pool[name] = audio;
        });
        this.promises.push(promise);
        return promise;
    }

    // 全ての音声が揃うまで待機するためのPromise
    ready() {
        return Promise.all(this.promises);
    }

    // 登録されている音声を再生する (毎回音声の最初から流す)
    play(name) {
        const ad = this.pool[name];
        if (ad) {
            ad.currentTime = 0; // 巻き戻し
            ad.play().catch(e => console.warn("再生に失敗:", e));
        }
    }

    // 音声を停止する
    stop(name) {
        const ad = this.pool[name];
        if (ad) {
            ad.pause();
            ad.currentTime = 0; // 巻き戻し
        }
    }
}

/**
 * ZzFXを使用した効果音（SE）を管理するクラス.
 * @class
 */
Public.SEPool = class {
    constructor() {
        this.pool = {};
    }

    // SEを名前付きで登録する
    // @param {string} name - SEの名前
    // @param {Array} params - ZzFXのパラメータ配列 [,,150,...]
    register(name, params) {
        this.pool[name] = params;
    }

    // 名前を指定してSEを再生する
    play(name) {
        const params = this.pool[name];
        if (params) {
            // ZzFX関数に配列を展開して渡す
            if (typeof zzfx === 'function') {
                zzfx(...params);
            } else {
                console.warn("zzfx function is not defined. Make sure ZzFXMicro is loaded.");
            }
        }
    }
}


// #4. スプライト・タスクの作成をサポートする機能

/**
 * 頻繁に必要になる定型のオブジェクトを作成するためのテンプレート群.
 * 基礎的なオブジェクトを生成する「ジェネレータ」と,
 * 生成済みのオブジェクトに機能を付与する「デコレータ」を提供する.
 *
 * 使用例:
 *     T = stdgam.Templates;
 *     obj = T.slider(
 *         T.finite( T.text("MESSAGE", {font: "20px Serif"}), 120 ),
 *         x1, y1
 *     );
 *     obj.slideTo(x2, y2, 120);
 *
 * デコレータは対象のオブジェクトを直接変更し, 特定の機能を付与する.
 * これはある種のコードスニペットであり, 他の機能との独立性は
 * 保証されないが, stdgam.Templatesで提供する機能同士を組み合わせる分には
 * 内部実装を特に意識しないで済むように構成している.
 *
 * 1. ジェネレータ
 * - text: 文字列を表示するオブジェクト
 * - ftext: フォーマット機能付きの文字列表示オブジェクト
 * - image: 画像を表示するオブジェクト
 * - custom: paintメソッドを持つオブジェクトをラップするオブジェクト
 * - pause: 一定時間が経過するまで後続のタスクを停止するオブジェクト
 * - call: 指定した関数を１回呼び出すだけのオブジェクト（実行後消える）
 *
 * 2. デコレータ
 * - finite: 指定した時間が経過すると自動的に消滅する
 * - scheduler: 指定した時間が経過した後に実行する処理を予約できる
 * - slider: slideToにより自動的に平行移動させることができる
 * - fader: fadeToによりアルファを自動的に変化させることができる
 *
 * @type {Object.<string, function>}
 */
Public.Templates = {
    // --- 1. ジェネレータ ---

    // テキストの描画を行うオブジェクト.
    // optを使って x, y, color, font, alpha を指定できる.
    // これらに加えて, ctxの持っている他の属性もoptで渡すことが可能
    text: (str, opt = {}) => {
        const obj = {
            text: str, active: true,
            x: opt["x"] || 0, y: opt["y"] || 0,
            color: opt["color"] || "white", alpha: opt["alpha"] || 1,
            font: opt["font"] || "20px sans-serif"
        };
        let common;
        obj.draw = function(GE, ctx) {
            ctx.save();
            common = common || Object.keys(opt).filter(key => key in ctx);
            common.forEach((key) => ctx[key] = opt[key]);
            ctx.globalAlpha = this.alpha;
            if(typeof opt["lineWidth"] === "number" && opt["lineWidth"] > 0){
                ctx.strokeStyle = opt["strokeStyle"] || this.color;
                ctx.strokeText(this.text, this.x, this.y);
            }
            ctx.fillStyle = this.color;
            ctx.font = this.font;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        };
        return obj;
    },

    // formatに含まれる "${}" という文字列を target[key] に置き換えて
    // 得られるテキストを表示するオブジェクト.
    // もしtargetが偽の場合は, このオブジェクト自身をターゲットとする.
    // 自動的にテキストが更新されること以外はtextと同じ挙動をする
    ftext: (format, target, key, opt = {}) => {
        const obj = stdgam.Templates.text("", opt);
        target = target || obj;
        let lastValue = target[key];
        obj.text = format.replaceAll("${}", target[key]);
        obj.execute = function(GE){
            const v = target[key];
            if(v != lastValue){
                this.text = format.replaceAll("${}", v);
                lastValue = v;
            }
            return true;
        };
        return obj;
    },

    // 画像の描画を行うオブジェクト.
    // optを使って x, y, color, alppha を指定できる.
    image: (img, opt = {}) => ({
        image: img, active: true,
        x: opt["x"] || 0, y: opt["y"] || 0,
        alpha: opt["alpha"] || 1,
        draw(GE, ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.drawImage(this.image, this.x, this.y);
            ctx.restore();
        }
    }),

    // paint(GE, ctx, x, y)を持つオブジェクトを受け取り,
    // それを描画するオブジェクトを生成する.
    // optを使って x, y, alppha を指定できる.
    custom: (contents, opt = {}) => ({
        contents: contents, active: true,
        x: opt["x"] || 0, y: opt["y"] || 0,
        alpha: opt["alpha"] || 1,
        draw(GE, ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            this.contents.paint(GE, ctx, this.x, this.y);
            ctx.restore();
        },
        execute(GE) {
            if(this.contents.execute) return this.contents.execute(GE);
            else return true;
        }
    }),

    // 指定されたフレーム数の間 「return false;」を実行し続けるオブジェクトを
    // 生成する. ただし, もし引数として負の数が与えられた場合はこの処理を
    // 無限に実行し続ける
    pause: (frames) => ({
        active: true,
        execute(GE) {
            if(frames < 0) return false;
            if(--frames <= 0) this.active = false;
            return false;
        }
    }),

    // 指定された関数を１回実行した後, 自動的に消滅するオブジェクト
    call: (callback) => ({
        active: true,
        execute(GE) {
            this.active = false;
            callback(GE);
            return false;
        }
    }),

    // --- 2. デコレータ ---
    // 内部ヘルパー: Traitsの受け皿と, タスクとして認識されるための execute を用意
    _initTraits: (obj) => {
        if (!obj._traits) obj._traits = [];
        // Scene.add(obj) でタスクとして登録されるよう、空のexecuteを生やしておく
        if (!obj.execute) obj.execute = () => true;
        return obj;
    },

    // 指定されたフレーム数が経過すると自動で消滅するようにする
    finite: function(obj, frames) {
        this._initTraits(obj);
        let timer = frames;
        // ただ配列に積むだけ！本体のexecuteを汚さない！
        obj._traits.push(function(GE) {
            if (--timer <= 0) this.active = false;
        });
        return obj;
    },

    // after(frames, callback) と loop(frames, callback) を実装する.
    // after: 指定時間が経過したとき、callbackを実行する
    // loop: callbackの実行結果がtrueである限り、afterと同じ処理を繰り返す
    scheduler: function(obj) {
        this._initTraits(obj);
        let timer = 0;
        let schedule;
        let nextFrames;

        obj.after = function(frames, callback){
            timer = frames;
            schedule = callback;
            nextFrames = false;
        }

        obj.loop = function(frames, callback){
            timer = frames;
            schedule = callback;
            nextFrames = frames;
        }

        obj._traits.push(function(GE) {
            if (timer > 0 && --timer <= 0 && schedule) {
                if(!nextFrames){
                    schedule(GE, this);
                }
                else {
                    if(schedule(GE, this)) timer = nextFrames;
                }
            }
        });
        return obj;
    },

    // moveTo(x, y) と slideTo(x, y, frames)を実装する.
    // moveTo: this.x, this.yを指定した値に変更する
    // slideTo: 現在位置から(x,y)までthis.x, this.yの値を変化させる
    slider: function(obj, x, y) {
        this._initTraits(obj);
        obj.x = x; obj.y = y;
        let tx = x, ty = y, duration = 0, elapsed = 0;
        let sx = x, sy = y;

        obj.moveTo = function(targetX, targetY) {
            this.x = targetX; this.y = targetY;
            sx = this.x; sy = this.y;
            tx = sx; ty = sy;
            duration = 0; elapsed = 0;
        };

        obj.slideTo = function(targetX, targetY, frames) {
            sx = this.x; sy = this.y;
            tx = targetX; ty = targetY;
            duration = frames; elapsed = 0;
        };

        obj._traits.push(function(GE) {
            if (elapsed < duration) {
                elapsed++;
                const t = (elapsed < duration) ? ((duration - elapsed) / duration) : 0;
                this.x = tx - (tx - sx) * t;
                this.y = ty - (ty - sy) * t;
            }
        });
        return obj;
    },

    // fadeTo(alpha, frames)を実装する.
    // fadeTo: 現在位置からalphaまでthis.alphaの値を変化させる
    fader: function(obj, alpha) {
        this._initTraits(obj);
        obj.alpha = alpha;
        let ta = alpha, duration = 0, elapsed = 0;
        let sa = alpha;

        obj.setAlpha = function(alpha) {
            this.alpha = alpha;
            ta = this.alpha;
            sa = this.alpha;
            duration = 0; elapsed = 0;
        };

        obj.fadeTo = function(target, frames) {
            sa = this.alpha;
            ta = target;
            duration = frames; elapsed = 0;
        };

        obj._traits.push(function(GE) {
            if (elapsed < duration) {
                elapsed++;
                const t = (elapsed < duration) ? ((duration - elapsed) / duration) : 0;
                this.alpha = ta - (ta - sa) * t;
            }
        });
        return obj;
    }
}

})(stdgam);


//--- 次に, ZzFX Micro Codeをインポートする

/*
 * ZzFX - Zuper Zmall Zound Zynth
 * https://github.com/KilledByAPixel/ZzFX?tab=readme-ov-file
 *
 * ZzFX Micro Codeを取り込み, zzfx()が使えるようにする.
 * 下記の一見すると何だかわからないコードが最終的に zzfx() を定義している.
 */

let // ZzFXMicro - Zuper Zmall Zound Zynth - v1.3.2 by Frank Force
zzfxV=.3,               // volume
zzfxX=new AudioContext, // audio context
zzfx=                   // play sound
(p=1,k=.05,b=220,e=0,r=0,t=.1,q=0,D=1,u=0,y=0,v=0,z=0,l=0,E=0,A=0,F=0,c=0,w=1,m=0,B=0
,N=0)=>{let M=Math,d=2*M.PI,R=44100,G=u*=500*d/R/R,C=b*=(1-k+2*k*M.random(k=[]))*d/R,
g=0,H=0,a=0,n=1,I=0,J=0,f=0,h=N<0?-1:1,x=d*h*N*2/R,L=M.cos(x),Z=M.sin,K=Z(x)/4,O=1+K,
X=-2*L/O,Y=(1-K)/O,P=(1+h*L)/2/O,Q=-(h+L)/O,S=P,T=0,U=0,V=0,W=0;e=R*e+9;m*=R;r*=R;t*=
R;c*=R;y*=500*d/R**3;A*=d/R;v*=d/R;z*=R;l=R*l|0;p*=zzfxV;for(h=e+m+r+t+c|0;a<h;k[a++]
=f*p)++J%(100*F|0)||(f=q?1<q?2<q?3<q?4<q?(g/d%1<D/2)*2-1:Z(g**3):M.max(M.min(M.tan(g)
,1),-1):1-(2*g/d%2+2)%2:1-4*M.abs(M.round(g/d)-g/d):Z(g),f=(l?1-B+B*Z(d*a/l):1)*(4<q?
s:(f<0?-1:1)*M.abs(f)**D)*(a<e?a/e:a<e+m?1-(a-e)/m*(1-w):a<e+m+r?w:a<h-c?(h-a-c)/t*w:
0),f=c?f/2+(c>a?0:(a<h-c?1:(h-a)/c)*k[a-c|0]/2/p):f,N?f=W=S*T+Q*(T=U)+P*(U=f)-Y*V-X*(
V=W):0),x=(b+=u+=y)*M.cos(A*H++),g+=x+x*E*Z(a**5),n&&++n>z&&(b+=v,C+=v,n=0),!l||++I%l
||(b=C,u=G,n=n||1);X=zzfxX,p=X.createBuffer(1,h,R);p.getChannelData(0).set(k);b=X.
createBufferSource();b.buffer=p;b.connect(X.destination);b.start()}
