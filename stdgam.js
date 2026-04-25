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
 * ゲームエンジンの実装を行うnamespace. 以下のクラスが外部に公開される.
 * - stdgam.GameEngine
 * - stdgam.Scene
 * - stdgam.CachePool
 * - stdgam.ImagePool
 * - stdgam.ImageAnimator
 * - stdgam.SoundPool
 * - stdgam.SEPool
 * - stdgam.ColorWrapper
 * - stdgam.LightGradation
 *
 * これに加えて, 以下の定数が外部に公開される.
 * - stdgam.Templates
 * - stdgam.colorOf
 *
 * @namespace
 */
var stdgam = stdgam || {};
(function(stdgam){

/**
 * @typedef {Object} Sprite - 描画処理を行うオブジェクト
 * @property {function(stdgam.GameEngine, CanvasRenderingContext2D): void} draw - 1フレーム分の描画処理を行う
 */

/**
 * @typedef {Object} Task - 1フレームごとにタスク処理を行うオブジェクト
 * @property {function(stdgam.GameEngine): void} execute - 1フレーム分のタスク処理を行う
 */

// #1. Sceneの実装

/**
 * ゲームにおける１つのモード, または１つのステージを表すクラス.
 * GameEngineからロードして使う.
 *
 * シーンは「スプライトリスト」と「タスクリスト」を持つ.
 * スプライトは draw(GE, ctx) メソッドを持つものの総称であり, 各フレームの描画処理を行う
 * (ここで, GEはGameEngine, ctxは描画に使うコンテクスト).
 * 一方, タスクは execute(GE) メソッドを持つものの総称であり, 1フレームごとにタスク処理を行う.
 *
 * これに加えて, Scene自体も draw(GE, ctx) や execute(GE) を持つことができる.
 * これらの機能を組み合わせてゲーム内の処理を実現する.
 * @class
 * @prop {function(stdgam.GameEngine, Object): void} [onLoad] - シーンがロードされた時に実行される初期化処理 (任意)
 * @prop {function(stdgam.GameEngine, CanvasRenderingContext2D): void} [draw] - シーン独自の描画処理 (任意)
 * @prop {function(stdgam.GameEngine): void} [execute] - シーン独自のタスク処理 (任意)
 */
stdgam.Scene = class {
    #GE;
    #sprites;
    #tasks;

// デバッグの助けに
// includesSprite(spr){ return this.#sprites.includes(spr); }

    /**
     * dfnが渡された場合, 共通の処理を済ませた後にその内容を自身に代入する.
     * これにより, 派生クラスを作らなくても, dfnの中に追加の定義を書いておけば
     * それを自身に適用できる.
     *
     * 例)
     * ```
     * let scene = new stdgam.Scene({
     *     onLoad(GE, args){ ...初期化処理... },
     *     draw(GE, ctx){ ...描画処理... } }
     * });
     * ```
     *
     * 上の例は次と等価である:
     * ```
     * let scene = new stdgam.Scene();
     * scene.onLoad = function(GE, args){ ...初期化処理... };
     * scene.draw(GE, ctx) = function{ ...描画処理... };
     * ```
     *
     * @param {Object.<string,*>} dfn - このオブジェクトに追加で定義する
     * 要素を集めた連想配列.
     */
    constructor(dfn = {}){
        this.init();
        this.#GE = null;
        Object.assign(this, dfn);
    }

    /**
     * このシーンがGEのカレントシーンになったとき呼び出される.
     * まず, GEをプライベートフィールドに保存する.
     * 次に, もしthis.onLoad(GE, args)が定義されていればこれを実行する.
     * @param {stdgam.GameEngine} GE - このシーンを実行するGameEngine
     * @param {Object.<string,*>} args - ロード処理のために引き渡す設定リスト
     */
    superOnLoad(GE, args){
        this.#GE = GE;
        if(this.onLoad) this.onLoad(GE, args);
    }

    /**
     * スプライトとタスクのリストを初期化する.
     * このメソッドを明示的に呼ばない限り, superOnLoadを実行しても
     * スプライトリストやタスクリストは初期化されない.
     */
    init(){
        this.#sprites = [];
        this.#tasks = [];
    }

    /**
     * スプライトをスプライトリストに追加する.
     * 追加位置は, 第2引数がtrueのとき先頭, falseのとき末尾である.
     * 省略したときは「末尾に」追加する.
     * @param {Sprite} spr - 登録するスプライト
     * @param {boolean} [first=false] - trueなら先頭に追加, falseなら末尾に追加
     */
    addSprite(spr, first = false){
        if(first){
            this.#sprites.unshift(spr);
        }
        else{
            this.#sprites.push(spr);
        }
    }

    /**
     * タスクをタスクリストに追加する.
     * 追加位置は, 第2引数がtrueのとき先頭, falseのとき末尾である.
     * 省略したときは「末尾に」追加する.
     * @param {Task} task - 登録するタスク
     * @param {boolean} [first=false] - trueなら先頭に追加, falseなら末尾に追加
     */
    addTask(task, first = false){
        if(first){
            this.#tasks.unshift(task);
        }
        else{
            this.#tasks.push(task);
        }
    }

    /**
     * スプライトとタスクを同時に登録するショートカット.
     * まず, objがスプライトの条件を満たすならスプライトリストに登録する.
     * 次に, objがタスクの条件を満たすならタスクリストに登録する.
     * 両方の条件を満たす場合は, 両方のリストに追加される.
     * @param {(Task|Sprite)} obj - 登録するオブジェクト
     * @param {boolean} [first=false] - trueなら先頭に追加, falseなら末尾に追加
     */
    add(obj, first = false){
        if (obj.draw) this.addSprite(obj, first);
        if (obj.execute) this.addTask(obj, first);
    }

    /**
     * スプライトリストの中に登録されているtargetの位置を探し,
     * 第2引数以降に指定されたスプライトをその直前に追加する (順序を保つ).
     * もしtargetが登録されていない場合, リストの先頭に追加する.
     * @param {Sprite} target - 追加位置の基準となるスプライト
     * @param {...Sprite} objs - 追加する1つ以上のスプライト
     */
    addSpriteBefore(target, ...objs) {
        const i = this.#sprites.indexOf(target);
        if (i >= 0) this.#sprites.splice(i, 0, ...objs);
        else this.#sprites.unshift(...objs); // 見つからなければ先頭へ
    }

    /**
     * スプライトリストの中に登録されているtargetの位置を探し,
     * 第2引数以降に指定されたスプライトをその直後に追加する (順序を保つ).
     * もしtargetが登録されていない場合, リストの末尾に追加する.
     * @param {Sprite} target - 追加位置の基準となるスプライト
     * @param {...Sprite} objs - 追加する1つ以上のスプライト
     */
    addSpriteAfter(target, ...objs) {
        const i = this.#sprites.indexOf(target);
        if (i >= 0) this.#sprites.splice(i + 1, 0, ...objs);
        else this.#sprites.push(...objs); // 見つからなければ末尾へ
    }

    /**
     * タスクリストの中に登録されているtargetの位置を探し,
     * 第2引数以降に指定されたタスクをその直前に追加する (順序を保つ).
     * もしtargetが登録されていない場合, リストの先頭に追加する.
     * @param {Task} target - 追加位置の基準となるタスク
     * @param {...Task} objs - 追加する1つ以上のタスク
     */
    addTaskBefore(target, ...objs) {
        const i = this.#tasks.indexOf(target);
        if (i >= 0) this.#tasks.splice(i, 0, ...objs);
        else this.#tasks.unshift(...objs); // 見つからなければ先頭へ
    }

    /**
     * タスクリストの中に登録されているtargetの位置を探し,
     * 第2引数以降に指定されたタスクをその直後に追加する (順序を保つ).
     * もしtargetが登録されていない場合, リストの末尾に追加する.
     * @param {Task} target - 追加位置の基準となるタスク
     * @param {...Task} objs - 追加する1つ以上のタスク
     */
    addTaskAfter(target, ...objs) {
        const i = this.#tasks.indexOf(target);
        if (i >= 0) this.#tasks.splice(i + 1, 0, ...objs);
        else this.#tasks.push(...objs); // 見つからなければ末尾へ
    }

    /**
     * 複数のオブジェクトを登録するためのショートカット.
     * listの要素のうち, スプライトであるものはスプライトリストに,
     * タスクであるものはタスクリストに追加する.
     * 第2引数がtrueの場合, 順序を維持したままリストの先頭に追加する.
     * 第2引数がfalseの場合, 順序を維持したままリストの末尾に追加する.
     * 省略時は末尾に追加する.
     * @param {Array<Sprite|Task>} list - 追加するオブジェクトの配列
     * @param {boolean} [first=false] - trueなら先頭に追加, falseなら末尾に追加
     */
    addSequence(list, first = false) {
        if (first) {
            const sprites = list.filter(e => e.draw);
            const tasks = list.filter(e => e.execute);
            this.#sprites = [...sprites, ...this.#sprites];
            this.#tasks = [...tasks, ...this.#tasks];
        } else {
            list.forEach(e => this.add(e));
        }
    }

    /**
     * 登録されているスプライトのdraw(GE, ctx)を順番に実行する.
     * ここでGEはこのゲームのGameEngine, ctxは描画に使うコンテクストである.
     * その後, 「activeが真」または「activeがundefined」のスプライトだけを
     * リストに残して, 他のスプライトはリストから削除する.
     *
     * もしthis.draw(GE, ctx)が定義されている場合, 最後にこれを実行する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     */
    superdraw(ctx){
        this.#sprites.forEach(e => e.draw(this.#GE, ctx));
        this.#sprites = this.#sprites.filter(e => (e.active || e.active === undefined));
        if(this.draw) this.draw(this.#GE, ctx);
    }

    /**
     * 登録されているタスクのexecute(GE)を順番に実行する.
     * ここでGEはこのゲームのGameEngineである.
     * ただし, あるタスクがfalseを返した場合, それより後のタスクは実行しない.
     *
     * その後, 「activeが真」または「activeがundefined」のタスクだけを
     * リストに残して, 他のタスクはリストから削除する.
     * 最後に, もしthis.execute(GE)が定義されている場合, これを実行する.
     *
     * 実際には, stdgam.Templatesの機能を実現するために, execute(GE)の実行後,
     * タスクが_traits要素を持つかどうかチェックする.
     * もし存在すれば, その中身の関数も順番に実行する (引数はexecuteと同じ).
     *
     * 【注意】execute()の中でタスクの追加・削除を行うと, for文の実行中に
     * 配列を変更したのと同じ現象が発生します！　特に, 自身よりも前に新しい要素を
     * 追加する場合は, falseを返して後続の処理を止めてください.
     */
    superexecute(){
        let i, f;
        for(i = 0, f = true; i < this.#tasks.length && f; i++){
            const task = this.#tasks[i];
            f = task.execute(this.#GE);
            if(task._traits){
                for(let trait of task._traits){
                    trait.call(task, this.#GE);
                }
            }
        }
        this.#tasks = this.#tasks.filter(e => (e.active || e.active === undefined));
        if(this.execute) this.execute(this.#GE);
    }

    /**
     * 指定されたジェネレータ関数を使ってジェネレータを作り, このオブジェクトの
     * 更新処理をこのジェネレータに委任する.
     * 具体的には, このジェネレータを実行するだけの関数をthis.executeに代入する.
     * ジェネレータが完了したときは, このメソッドを実行する直前のexecuteの値に戻す.
     * @param {stdgam.GameEngine} GE - ジェネレータ関数の初期化時に渡すGameEngine
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
 * キー入力を管理するクラス.
 * GameEngineのinput要素に格納され, キー入力の管理に利用される.
 * @class
 */
stdgam.InputManager = class {
    #currentKeys;
    #previousKeys;

    constructor(){
        this.#currentKeys = new Set();
        this.#previousKeys = new Set();
        window.addEventListener('keydown', (e) => this.#currentKeys.add(e.code));
        window.addEventListener('keyup', (e) => this.#currentKeys.delete(e.code));
        window.addEventListener('blur', () => this.#currentKeys.clear());
    }

    /**
     * 現在の状態を「1フレーム前の状態」としてコピーする.
     */
    update() {
        this.#previousKeys = new Set(this.#currentKeys);
    }

    /**
     * シーン切り替え時に「今押されているキー」を「前から押されていたこと」にする.
     * これにより, 新しいシーンでisJustPressedが最初からtrueになるのを防ぐ
     * (現時点の実装はupdate()と同じ挙動だが, 念のため別途定義しておく).
     */
    sync() {
        this.#previousKeys = new Set(this.#currentKeys);
    }

    /**
     * そのキーが今押されているか調べる.
     * @param {string} code - 調べるキーのコード値
     * @returns {boolean} 押されていればtrue, そうでなければfalse
     */
    isDown(code) {
        return this.#currentKeys.has(code);
    }

    /**
     * そのキーが「今は押されている」かつ「1フレーム前は押されていなかった」とき
     * trueを返す. そうでないとき, falseを返す.
     * @param {string} code - 調べるキーのコード値
     * @returns {boolean} 条件を満たすならばtrue, そうでなければfalse
     */
    isJustPressed(code) {
        return this.#currentKeys.has(code) && !this.#previousKeys.has(code);
    }

    /**
     * キー入力のチェックを補佐する関数.
     * 「キーを押し続けたときに毎フレーム反応するのでは困るが, 一定の間隔が
     * 空いていればキーを離していなくてもキー入力を受け付けたい」ケースに用いる.
     *
     * 具体的には, 次の処理を実行する.
     * 1. もし codes1 の中に isJustPressed が真のものがあれば,
     *    そのような一番最初のキーコードとそのインデックスの組を返す.
     * 2. さらに, (1)に該当するものが無く, かつbusyFlagが偽のとき,
     *    codes2 の中で isDown が真である最初のキーを探す.
     *    見つかればそのキーコードとインデックスの組を返す.
     * 3. 上記のどちらにも該当しないとき, [null, -1]を返す.
     *
     * 【注意】インデックスはあくまで利用時の利便性のために返している.
     * インデックスだけではどちらのリストのものか判別できないので注意.
     * @param {string[]} codes1 - isJustPressedで判定するキーのリスト
     * @param {string[]} codes2 - busyでなければisDownで済ませてもよいキーのリスト
     * @param {boolean} busyFlag - trueならばisJustPressedによる判定だけを行う.
     * falseならば一部のキー (codes2の要素) についてisDownで判定を代用する.
     * @returns {Array<?string|number>} 条件を満たすキーが見つかったとき, そのキーコードと,
     * codes1またはcodes2におけるインデックスの組を返す.
     */
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
 * @prop {stdgam.GameEngine} owner - タイマーイベントを送る対象
 * @prop {boolean} isRunning - 既にタイマーが稼働中か
 */
let TimeKeeper = class {
    /**
     * このゲームで目標とするフレームレート
     * @type {number}
     */
    static fps = 60;

    /**
     * @param {stdgam.GameEngine} owner - タイマーイベントを送る対象
     */
    constructor(owner){
        this.owner = owner;
        this.isRunning = false;
    }

    /**
     * タイマー処理を開始する.
     * requestAnimationFrameを利用してタイマー処理のループを動かし,
     * 目標フレームレートに概ね従うタイミングでタイマーイベントを発生させる.
     * もし既にタイマー処理が稼働中なら何もしない.
     */
    run(){
        if(this.isRunning) return;
        this.isRunning = true;

        const interval = 1000 / TimeKeeper.fps; // 1フレームあたりのミリ秒 (約16.6ms)
        let lastTime = performance.now();

        const loop = (currentTime) => {
           const elapsed = currentTime - lastTime;
           // 指定した間隔 (16.6ms) 以上が経過したかチェック
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
 * Sceneオブジェクトをロードし, 毎フレームごとに更新処理を実行させることにより
 * ゲーム処理を実現する.
 *
 * 管理を簡単にするため, 使用するシーンは最初にaddSceneメソッドで登録する.
 * このときに設定したシーン名を使って, どのシーンをロードするか指定する.
 * また, キー入力判定に必要なInputManagerや画像・音声を管理するオブジェクトも
 * まとめて提供する.
 * @class
 * @prop {stdgam.InputManager} input - キー入力の管理をするオブジェクト
 * @prop {stdgam.SEPool} se - ZzFXによるSEを管理するオブジェクト
 * @prop {stdgam.ImagePool} images - 画像を管理するオブジェクト
 * @prop {stdgam.SoundPool} sounds - 音声を管理するオブジェクト
 * @prop {stdgam.CachePool} caches - オフスクリーン・キャンバスを管理するオブジェクト
 */
stdgam.GameEngine = class {
    #canvas;
    #ctx;
    #scenes;
    #currentScene;
    #timer;

    /**
     * 指定されたキャンバスを描画に用いるGameEngineを生成する.
     * @param {string} canvasID - HTMLのキャンバス要素のID
     */
    constructor(canvasID) {
        this.#canvas = document.getElementById(canvasID);
        this.#ctx = this.#canvas.getContext('2d');
        this.#scenes = {};
        this.#currentScene = null;

        this.input = new stdgam.InputManager();
        this.#timer = new TimeKeeper(this);
        this.se = new stdgam.SEPool();
        this.images = new stdgam.ImagePool();
        this.sounds = new stdgam.SoundPool();
        this.caches = new stdgam.CachePool();
    }

    /**
     * ゲームの実行を開始する.
     */
    run(){
        this.#timer.run();
    }

    /**
     * nameという名前で指定されたシーンを登録する.
     * @param {string} name - シーンの登録名
     * @param {stdgam.Scene} scene - 登録するシーン
     */
    addScene(name, scene) {
        this.#scenes[name] = scene;
    }

    /**
     * nameという名前で登録されているシーンをカレントシーンとする.
     * 第2引数としてオプションリストを指定した場合, これをカレントシーンに伝える.
     * もし該当するシーンがなければ何もしない.
     * @param {string} name - シーンの登録名
     * @param {Object.<string,*>} [opt={}] - カレントシーンに渡す設定リスト
     */
    changeScene(name, opt = {}) {
        this.input.sync();
        if(this.#scenes[name]){
            this.#currentScene = this.#scenes[name];
            this.#currentScene.superOnLoad(this, opt);
        }
    }

    /**
     * 基本的にTimeKeeperから呼ばれる.
     * カレントシーンに1フレーム分の処理を実行させる. 具体的には
     * 1. 画面をクリアする.
     * 2. カレントシーンのsuperexecuteを呼び出しタスク処理を実行させる.
     * 3. その後, カレントシーンのsuperdrawを呼び出し描画処理を実行させる.
     *
     * という手順を行う.
     */
    update(){
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

        if(this.#currentScene){
            this.#currentScene.superexecute();
            this.#currentScene.superdraw(this.#ctx);
        }

        this.input.update();
    }

    /**
     * 画像・音声のロード完了を待ってからcallbackを実行するasync関数.
     * このメソッドを呼び出しても, 呼び出したプロセス自体は停止しない.
     * (既にロードが完了していれば, 即座にcallbackが非同期処理として実行される)
     *
     * JavaScriptでは画像や音声のオブジェクトを作っても即座にロードが完了せず,
     * バックグラウンドで読み込み処理を行う. それらが確実に完了した状態で
     * 目的の処理を実行したいときにこのメソッドを使う.
     *
     * 例)
     * ```
     * const GE = new stdgam.GameEngine("myCanvas");
     * GE.images.load("IMAGE_01", "./my_image1.png");
     * GE.images.load("IMAGE_02", "./my_image2.png");
     *
     * GE.ready(() => {
     *    my_paint_operation( pool.get("IMAGE_01") );
     *    my_paint_operation( pool.get("IMAGE_02") );
     * });
     * ```
     *
     * @param {function(): void} callback - ロードが確実に完了した状態で
     * 呼び出される関数
     */
    async ready(callback){
        this.images.ready().then(() => {
            this.sounds.ready().then(callback);
        });
    }
}


// #3. 画像・音声の管理をサポートする機能

/**
 * イメージを指定された幅・高さに基づいて分割するクラス.
 * より正確に言うと, 実際に分割した画像を生成するのではなく,
 * 単に「設定に基づいて元画像の適切な一部分を描画する」機能を持つだけである.
 * @class
 */
stdgam.ImageCutter = class {
    #img;
    #w;
    #h;

    /**
     * 指定された画像を横width, 縦heightのブロックに等分割して扱う.
     * @param {HTMLImageElement} img - 分割対象となる画像
     * @param {number} width - ブロック1個分の幅
     * @param {number} height - ブロック1個分の高さ
     */
    constructor(img, width, height){
        this.#img = img;
        this.#w = width;  // 1コマの横幅
        this.#h = height; // 1コマの縦幅
    }

    /**
     * 分割した画像のうち左からa番目, 上からb番目の部分を描画する.
     * ただし, a, bは0から数え始めるものとする.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - 描画位置のx座標
     * @param {number} y - 描画位置のy座標
     * @param {number} a - 分割のうち, 左から何番目を使うか (0から数え始める)
     * @param {number} b - 分割のうち, 上から何番目を使うか (0から数え始める)
     */
    paint(ctx, x, y, a, b){
        const sx = this.#w * a;
        const sy = this.#h * b;
        ctx.drawImage(
            this.#img, sx, sy, this.#w, this.#h,
            x, y, this.#w, this.#h
        );
    }
}

/**
 * ImageCutterを使って簡易的なコマ送りアニメを生成するためのクラス.
 * 具体的には,
 * 1. 最初にregisteメソッドによりImageCutterと「アニメーション定義リスト」の組を登録する.
 * 2. 次に, generateメソッドで「コマ送り描画オブジェクト」を生成する.
 * 3. こうして生成したコマ送り描画オブジェクトのpaintメソッドで各コマを描画する.
 *
 * という手順によりコマ送りアニメを描画する.
 */
stdgam.ImageAnimator = class{
    #pool;

    /**
     * 空のインスタンスを生成する.
     */
    constructor(){
        this.#pool = {};
    }

    /**
     * ImageCutterオブジェクトと「アニメーション定義リスト」の組を
     * 指定された名前で登録する. ここで, アニメーション定義リストは,
     *
     * [a, b, frames, offX, offY]
     *
     * という形のリストをアニメーションのコマの数だけ並べた
     * 2重配列である (offX, offYは省略可).
     *
     * 各成分は次の意味を持つ.
     * - (a,b) : ImageCutter内のどのブロックを描画するか指定する
     * - frames : そのコマを表示するフレーム数
     * - offX : 横方向に表示位置をどれだけずらすか (省略時は0)
     * - offY : 縦方向に表示位置をどれだけずらすか (省略時は0)
     *
     * たとえば, 各コマの画像を横一列に並べて連結したものを
     * ImageCutterにより分割して使う場合, 次のようなコードになる.
     *
     * ```
     * const IC = new stdgam.ImageCutter(連結した画像, 1コマの横幅, 1コマの縦幅);
     * const IA = new stdgam.ImageAnimator();
     * IA.register("animation_01", [
     *     [0, 0, 表示フレーム数],
     *     [1, 0, 表示フレーム数],
     *     [2, 0, 表示フレーム数], ...
     * ]);
     * ```
     *
     * @param {string} name - このアニメーションに付ける登録名
     * @param {stdgam.ImageCutter} IC - 画像を保持するImageCutter
     * @param {Array<number[]>} dfn - アニメーション定義リスト
     * @throws {Error} アニメーション定義リストの中に長さが2以下のリストが含まれていたり,
     * 長さが3以上でも a < 0 ||  b < 0 || frames <= 0 であるリストが含まれているとき
     */
    register(name, IC, dfn){
        for(const arr of dfn){
            if(arr.length < 3 || !(arr[0] >= 0) || !(arr[1] >= 0)){
                throw new Error("ImageAnimator: リストの書式が正しくありません");
            }
            if(!(arr[2] > 0)){
                throw new Error("ImageAnimator: 各コマの表示フレーム数は1以上でなれけばいけません");
            }
        }
        this.#pool[name] = { IC: IC, dfn: dfn };
    }

    /**
     * 指定された名前で登録されている情報を元にして「コマ送り描画オブジェクト」を生成する.
     * このオブジェクトは次のメソッドを持つ.
     * - paint(ctx, x, y) - 指定された位置に現在のコマを描画し, 内部状態を更新する
     * - finished() - 描画するコマが残っていないときtrue, そうでないときfalse
     *
     * paintメソッドを呼び出されるたびに内部状態が更新され,
     * 自動的にコマ送りが進行する. すべてのコマを描画し終えたときの挙動は
     * repeatによって変わる.
     * - repeatがtrueならば, 最初のコマに戻る
     * - repeatがfalseならば, これ以上何も描画しない
     *
     * @param {string} name - 使用するアニメーションの登録名
     * @param {boolean} [repeat=false] - リピートするか
     * @returns {Object} 生成されたコマ送り描画オブジェクト
     */
    generate(name, repeat=false){
        const entry = this.#pool[name];
        if(!entry || entry.dfn.length == 0) return null;

        let i = 0;
        let [a, b, frames, offX, offY] = entry.dfn[i];
        offX = offX || 0;
        offY = offY || 0;

        return {
            finished(){
                return (i >= entry.dfn.length);
            },
            paint(ctx, x, y){
                if(i >= entry.dfn.length) return;
                entry.IC.paint(ctx, x + offX, y + offY, a, b);
                if(--frames <= 0){
                    if(++i >= entry.dfn.length){
                        if(repeat) i = 0;
                        else return;
                    }
                    [a, b, frames, offX, offY] = entry.dfn[i];
                    offX = offX || 0;
                    offY = offY || 0;
                }
            }
        };
    }
}

/**
 * オフスクリーン・キャンバスを管理するクラス.
 * JavaScriptでは画像のキャッシュを作るためにオフスクリーン・キャンバスを使う.
 * このオフスクリーン・キャンバス (以下, 単にキャンバスと呼ぶ) を生成・管理する.
 * @class
 */
stdgam.CachePool = class {
    #pool;

    /**
     * 空のインスタンスを作る.
     */
    constructor(){
        this.#pool = {};
    }

    /**
     * 新しいキャンバスを作り, nameという名前で登録する.
     * もしdrawFnが与えられた場合, キャンバスを生成したあと, このキャンバスの
     * コンテクストを引数として drawFn(ctx) を実行する.
     * @param {string} name - 作られたキャンバスの登録名
     * @param {number} width - キャンバスの横幅
     * @param {number} height - キャンバスの縦幅
     * @param {function(CanvasRenderingContext2D): void} [drawFn=(ctx)=>{}] -
     * 作られたキャンバスに対してすぐに作業をしたい場合はコールバック関数を指定する.
     * ここで, コールバック関数の引数は生成されたキャンバスのコンテクストである.
     * @returns {HTMLCanvasElement} - 生成されたキャンバス
     */
    createCache(name, w, h, drawFn = (ctx) => {}){
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        drawFn(c.getContext('2d'));
        this.#pool[name] = c;
        return c;
    }

    /**
     * 指定した名前で登録されているキャンバスを返す.
     * @param {string} name - キャンバスの登録名
     * @returns {HTMLCanvasElement} - 指定された登録名のキャンバス. 存在しなければundefined
     */
    get(name){
        return this.#pool[name];
    }
}

/**
 * 画像ファイルから読み込んだイメージを管理するクラス.
 * @class
 */
stdgam.ImagePool = class {
    #pool;
    #promises;

    /**
     * 空のインスタンスを作る.
     */
    constructor(){
        this.#pool = {};
        this.#promises = []; // ロード状態を追跡するリスト
    }

    /**
     * 画像を読み込み, それを指定した名前で登録する.
     * ただし, JavaScriptでは画像オブジェクトを作っても即座にロードが
     * 完了するのではなく, バックグラウンドで読み込み処理を行う. 
     * そのため, 返却値は画像のロード待ちを行なっているPromiseオブジェクトである.
     *
     * 例)
     * ```
     * const pool = new stdgam.ImagePool();
     * const promise = pool.load("IMAGE_01", "./my_image1.png");
     * promise.then((v) => {
     *     my_paint_operation( pool.get("IMAGE_01") );
     * });
     * ```
     *
     * 普通はこのPromiseオブジェクトを直接使うのではなく, readyメソッドを利用する
     * (readyメソッドの例を参照のこと).
     *
     * また, GameEngineオブジェクトがデフォルトで所持するImagePoolに関しては,
     * GameEngineのreadyメソッドによりロード待ちを行うほうが好ましい.
     * @param {string} name - ロードした画像に付ける登録名
     * @param {string} url - 読み込む画像のURL
     * @returns {Promise<HTMLImageElement>} 画像のロード待ちを行うPromiseオブジェクト
     */
    load(name, url){
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${url}`));
            img.src = url;
            this.#pool[name] = img;
        });
        this.#promises.push(promise);
        return promise;
    }

    /**
     * 全ての画像のロードが完了するまで待機するためのPromiseを返す.
     * 通常は次のようなコードを書く.
     *
     * 例)
     * ```
     * const pool = new stdgam.ImagePool();
     * pool.load("IMAGE_01", "./my_image1.png");
     * pool.load("IMAGE_02", "./my_image2.png");
     *
     * pool.ready().then((v) => {
     *    my_paint_operation( pool.get("IMAGE_01") );
     *    my_paint_operation( pool.get("IMAGE_02") );
     * });
     * ```
     *
     * ただし, GameEngineオブジェクトがデフォルトで所持するImagePoolに関しては,
     * GameEngineのreadyメソッドによりロード待ちを行うほうが好ましい.
     * @returns {Promise<HTMLImageElement[]>} 全部の画像のロード待ちを行うPromiseオブジェクト
     */
    ready() {
        return Promise.all(this.#promises);
    }

    /**
     * 指定した名前で登録されている画像を返す.
     * @param {string} name - 画像の登録名
     * @returns {HTMLImageElement} - 指定された登録名の画像. 存在しなければundefined
     */
    get(name){
        return this.#pool[name];
    }
}

/**
 * 音声ファイルから読み込んだ音声 (HTMLAudioElement) を管理するクラス.
 * 事前に登録しておいた音声の再生・停止を行う
 * (HTMLAudioElementオブジェクトを直接返す機能はない).
 *
 * 【注意】現在のブラウザでは, ユーザがそのページ内で何か操作をするまで
 * 勝手に音声を鳴らすことができない！　何かしらの入力を受けてから使うこと.
 * @class
 */
stdgam.SoundPool = class {
    #pool;
    #promises;

    /**
     * 空のインスタンスを作る.
     */
    constructor() {
        this.#pool = {};
        this.#promises = [];
    }

    /**
     * 音声をHTMLAudioElementとして読み込み, それを指定した名前で登録する.
     * ただし, JavaScriptでは音声オブジェクトを作っても即座にロードが
     * 完了するのではなく, バックグラウンドで読み込み処理を行う. 
     * そのため, 返却値は音声のロード待ちを行なっているPromiseオブジェクトである.
     *
     * 例)
     * ```
     * const pool = new stdgam.SoundPool();
     * const promise = pool.load("BGM_01", "./my_bgm.wav");
     * promise.then((v) => {
     *     pool.play("BGM_01");
     * });
     * ```
     *
     * 普通はこのPromiseオブジェクトを直接使うのではなく, readyメソッドを利用する
     * (readyメソッドの例を参照のこと).
     *
     * また, GameEngineオブジェクトがデフォルトで所持するSoundPoolに関しては,
     * GameEngineのreadyメソッドによりロード待ちを行うほうが好ましい.
     * @param {string} name - ロードした音声に付ける登録名
     * @param {string} url - 読み込む音声のURL
     * @returns {Promise<HTMLAudioElement>} 音声のロード待ちを行うPromiseオブジェクト
     */
    load(name, url) {
        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
            audio.src = url;
            this.#pool[name] = audio;
        });
        this.#promises.push(promise);
        return promise;
    }

    /**
     * 全ての音声のロードが完了するまで待機するためのPromiseを返す.
     * 通常は次のようなコードを書く.
     *
     * 例)
     * ```
     * const pool = new stdgam.SoundPool();
     * pool.load("BGM_01", "./bgm_01.wav");
     * pool.load("BGM_02", "./bgm_02.wav");
     *
     * pool.ready().then((v) => {
     *    my_operation_with_sounds(pool);
     * });
     * ```
     *
     * ただし, GameEngineオブジェクトがデフォルトで所持するSoundPoolに関しては,
     * GameEngineのreadyメソッドによりロード待ちを行うほうが好ましい.
     * @returns {Promise<HTMLAudioElement[]>} 全部の音声のロード待ちを行うPromiseオブジェクト
     */
    ready() {
        return Promise.all(this.#promises);
    }

    /**
     * 指定した名前で登録されている音声を再生する (存在しなければ何もしない).
     * 既に再生中の場合, 最初に巻き戻して再生し直す.
     * @param {string} name - 再生する音声の登録名
     * @param {boolean} [loop=false] - ループ再生をするか
     */
    play(name, loop=false) {
        const ad = this.#pool[name];
        if (ad) {
            ad.currentTime = 0; // 巻き戻し
            ad.loop = loop;
            ad.play().catch(e => console.warn("再生に失敗:", e));
        }
    }

    /**
     * 指定した名前で登録されている音声が再生中なら, 再生を停止する.
     * 該当する音声がなかったり再生中でなければ何もしない.
     * @param {string} name - 停止するする音声の登録名
     */
    stop(name) {
        const ad = this.#pool[name];
        if (ad) {
            ad.pause();
        }
    }

    /**
     * 登録されているすべての音声の再生を停止する.
     * 再生中でなければ何もしない.
     */
    stopAll() {
        for(const key of Object.keys(this.#pool)){
            const ad = this.#pool[key];
            ad.pause();
        }
    }
}

/**
 * ZzFXを使用した効果音（SE）を管理するクラス.
 * このクラスでは, 「ZzFXに渡すパラメータの配列」のことを単にSEと呼ぶ.
 * これを事前に登録しておき, playメソッドでSEを再生する.
 * @class
 */
stdgam.SEPool = class {
    #pool;

    /**
     * 空のインスタンスを作る.
     */
    constructor() {
        this.#pool = {};
    }

    /**
     * 指定した名前でSEを登録する.
     * ここで「SE」とは「ZzFXに渡すパラメータの配列」のことである.
     * @param {string} name - SEの名前
     * @param {Array} params - ZzFXのパラメータの配列 ( [,,150,...] など)
     */
    register(name, params) {
        this.#pool[name] = params;
    }

    /**
     * 指定した名前で登録されているSEを再生する.
     * もし存在しなければ何もしない.
     * @param {string} name - 再生するSEの登録名
     */
    play(name) {
        const params = this.#pool[name];
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

/*---------- 先にJSDocの型定義を行う ----------*/

/**
 * @typedef {Sprite} Templates_text
 * @prop {string} text - 表示するテキスト
 * @prop {number} x - 描画位置のx座標
 * @prop {number} y - 描画位置のy座標
 * @prop {string} color - テキストの色
 * @prop {string} font - テキストのフォント
 * @prop {number} alpha - 不透明度
 */

/**
 * @typedef {Templates_text} Templates_ftext
 */

/**
 * @typedef {Sprite} Templates_image
 * @prop {HTMLImageElement} image - 描画する画像
 * @prop {number} x - 描画位置のx座標
 * @prop {number} y - 描画位置のy座標
 * @prop {number} alpha - 不透明度
 */

/**
 * @typedef {Sprite} Templates_custom
 * @prop {Object} contents - paint(GE, ctx, x, y)を持つオブジェクト
 * @prop {number} x - 描画位置のx座標
 * @prop {number} y - 描画位置のy座標
 * @prop {number} alpha - 不透明度
 */

/**
 * @typedef {Task} Templates_scheduler
 * @prop {function(number, function(stdgam.GameEngine, Templates_scheduler): void): void} after - 
 * 指定時間が経過したとき第2引数で指定したコールバック関数を実行する.
 * ここで, コールバック関数の引数は (GE, self) である
 * (GEはタスク処理に用いるGameEngine, selfはこのオブジェクト自身).
 * @prop {function(number, function(stdgam.GameEngine, Templates_scheduler): boolean): void} loop -
 * コールバック関数の実行結果がtrueである限り, afterと同じ処理を繰り返す
 */

/**
 * @typedef {Task} Templates_slider
 * @prop {function(number, number): void} moveTo - this.x, this.yを指定した値に変更する
 * @prop {function(number, number, number): void} slideTo - 現在位置から第1～第2引数で指定した座標まで, 第3引数で指定したフレーム数を掛けてthis.x, this.yの値を等速変化させる
 */

/**
 * @typedef {Task} Templates_fader
 * @prop {function(number, number): void} fadeTo - 現在値から第1引数で指定した値まで, 第3引数で指定したフレーム数を掛けてthis.alphaの値を等速変化させる
 */

/*---------- ここまでJSDocの型定義 ----------*/

/**
 * 頻繁に必要になる定型のオブジェクトを作成するためのテンプレート群.
 * 基礎的なオブジェクトを生成する「ジェネレータ」と,
 * 生成済みのオブジェクトに機能を付与する「デコレータ」を提供する.
 *
 * 使用例:
 * ```
 *     T = stdgam.Templates;
 *     obj = T.slider(
 *         T.finite( T.text("MESSAGE", {font: "20px Serif"}), 120 ),
 *         x1, y1
 *     );
 *     obj.slideTo(x2, y2, 120);
 * ```
 *
 * デコレータは対象のオブジェクトを直接変更し, 特定の機能を付与する.
 * これはある種のコードスニペットであり, 他の機能との独立性は保証されないが, 
 * stdgam.Templatesで提供する機能同士を組み合わせる分には
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
 * @namespace
 * @memberof stdgam
 */
stdgam.Templates = {
    // --- 1. ジェネレータ ---

    /**
     * テキストの描画を行うオブジェクト.
     * オプションリストを使って x, y, color, font, alpha を指定できる.
     * これらに加えて, CanvasRenderingContext2Dに対して指定可能な他の属性も
     * optで渡すことができる.
     * @param {string} str - 表示する文字列
     * @param {Object.<string,*>} [opt={}] - オプションリスト
     * @returns {Templates_text} 生成されたオブジェクト
     */
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

    /**
     * formatに含まれる "${}" という文字列を全部 target[key] に置き換えて
     * 得られるテキストを表示するオブジェクト.
     * もしtargetが偽の場合は, このオブジェクト自身をターゲットとする.
     *
     * 自動的にテキストが更新されること以外はtextと同じ挙動をする.
     * オプションリストの扱いなども共通である.
     * @param {string} format - 雛形となる文字列
     * @param {Object|null|false} target - 観察対象
     * @param {string} key - 取得するプロパティの名前
     * @param {Object.<string,*>} [opt={}] - オプションリスト
     * @returns {Templates_ftext} 生成されたオブジェクト
     */
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

    /**
     * 画像の描画を行うオブジェクト.
     * オプションリストを使って x, y, alpha を指定できる.
     * @param {HTMLImageElement} img - 表示する画像
     * @param {Object.<string,*>} [opt={}] - オプションリスト
     * @returns {Templates_image} 生成されたオブジェクト
     */
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

    /**
     * paint(GE, ctx, x, y)を持つオブジェクトを受け取り,
     * それを描画するオブジェクトを生成する.
     * ここで, GEはstdgam.GameEngine, ctxは描画に使うコンテクストを表す.
     *
     * 文字列でも画像でもないオブジェクトをTemplatesの枠組みで使いたいとき,
     * customでラップして用いる.
     *
     * オプションリストを使って x, y, alppha を指定することもできる.
     * @param {Object} contents - 実際に描画を行うオブジェクト
     * @param {Object.<string,*>} [opt={}] - オプションリスト
     * @returns {Templates_custom} 生成されたオブジェクト
     */
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

    /**
     * 指定されたフレーム数の間 「return false;」を実行し続けるオブジェクト.
     * もし引数として負の数が与えられた場合はこの処理を無限に実行し続ける.
     * @param {number} frames - 動作を続けるフレーム数. 負の数の場合は無限に実行し続ける.
     * @returns {Task} 生成されたオブジェクト
     */
    pause: (frames) => ({
        active: true,
        execute(GE) {
            if(frames < 0) return false;
            if(--frames <= 0) this.active = false;
            return false;
        }
    }),

    /**
     * 指定された関数を1回実行した後, 自動的に消滅するオブジェクト.
     * @param {function(stdgam.GameEngine): void} callback - 実行する関数
     * @returns {Task} 生成されたオブジェクト
     */
    call: (callback) => ({
        active: true,
        execute(GE) {
            this.active = false;
            callback(GE);
            return false;
        }
    }),

    // --- 2. デコレータ ---

    /**
     * デコレータの機能を実現するために使うヘルパー関数.
     * objに _traits 要素が定義されていなければ _traits に空リストをセットする. 
     * さらに, もし execute(GE) メソッドがなければ, obj.execute に
     * true を返すだけの空の関数をセットする.
     * @param {Object} obj - 対象のオブジェクト
     * @returns {Object} objを返す
     */
    _initTraits: (obj) => {
        if (!obj._traits) obj._traits = [];
        // Scene.add(obj) でタスクとして登録されるよう, 空のexecuteを生やしておく
        if (!obj.execute) obj.execute = () => true;
        return obj;
    },

    /**
     * 指定されたフレーム数が経過すると自動で消滅するようにする.
     * @param {Object} obj - 対象のオブジェクト
     * @returns {Object} objを返す
     */
    finite: function(obj, frames) {
        this._initTraits(obj);
        let timer = frames;
        // ただ配列に積むだけ！本体のexecuteを汚さない！
        obj._traits.push(function(GE) {
            if (--timer <= 0) this.active = false;
        });
        return obj;
    },

    /**
     * objに after(frames, callback) と loop(frames, callback) を付与する.
     * - after: 指定時間が経過したときcallbackを実行する
     * - loop: callbackの実行結果がtrueである限りafterと同じ処理を繰り返す
     *
     * ここで, callbackの受け取る引数は (GE, self) である.
     * GEはタスク処理を実行しているGameEngine, selfはobj自身である.
     * @param {Object} obj - 対象のオブジェクト
     * @returns {Object} objを返す
     */
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

    /**
     * objに moveTo(x, y) と slideTo(x, y, frames) を付与する.
     * moveTo: this.x, this.yを指定した値に変更する.
     * slideTo: 現在位置から(x,y)までthis.x, this.yの値を等速変化させる.
     * @param {Object} obj - 対象のオブジェクト
     * @returns {Object} objを返す
     */
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

    /**
     * objに fadeTo(alpha, frames) を付与する.
     * - fadeTo: 現在位置からalphaまでthis.alphaの値を変化させる
     * @param {Object} obj - 対象のオブジェクト
     * @returns {Object} objを返す
     */
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


// #5. グラフィック描画のサポートを行うクラス・関数

/**
 * 色指定文字列をラップして明度操作（lighter）などのメソッドを提供するクラス.
 * 実際は単に渡された文字列をラップするのではなく, カラーネームや相対カラー構文を
 * 渡された場合に, ブラウザのCSS解析機能を用いて評価済みの絶対値（#RRGGBB 等）へと
 * 変換して保持する. この機能により, 相対指定が何重にも入れ子になることを防止できる.
 *
 * また, このクラスはtoStringメソッドを実装しており, CanvasRenderingContext2Dの
 * fillStyle等に代入するときは自動的に文字列へ変換される.
 *
 * ```
 * // 例
 * const c1 = new stdgam.ColorWrapper("orange").lighter(10);
 * ctx.fillStyle = c1;  // 自動的に文字列へ変換される
 *
 * // stdgam.colorOfを使う場合
 * const c2 = stdgam.colorOf("blue").lighter(-20);
 * ctx.fillStyle = c2;
 * ```
 *
 * @class
 * @prop {string} s - ラップされている色指定文字列. ただし, コンストラクタに渡された文字列を
 * そのまま保持するのではなく, ColorWrapper.resolveにより変換した後の文字列を保持する.
 */
stdgam.ColorWrapper = class{
    /**
     * ブラウザのCSS解析機能を利用するためだけに用意したキャンバスコンテキスト.
     * @type {CanvasRenderingContext2D}
     */
    static #resolverCtx = document.createElement('canvas').getContext('2d');

    /**
     * ブラウザのCSS解析機能を利用して評価済みの色指定文字列を取得する.
     * @param {string} colorStr - CSSの色指定文字列
     * @returns {string} 評価結果
     */
    static resolve(colorStr){
        this.#resolverCtx.fillStyle = colorStr;
        return this.#resolverCtx.fillStyle;
    }

    /**
     * 指定された色指定文字列を元にインスタンスを生成する.
     * @param {string} colorStr - CSSの色指定文字列
     */
    constructor(colorStr){
        this.s = stdgam.ColorWrapper.resolve(colorStr);
    }

    /**
     * @returns 文字列へ変換した結果
     */
    toString(){
        return this.s;
    }

    /**
     * HSLの相対カラー指定を利用して新しいインスタンスを生成する.
     * より正確には, `hsl(from ${this} ${modStr})` の実行結果を引数として
     * 新しいインスタンスを生成する.
     * @param {string} modStr - HSLの相対カラー指定で変換指示に用いる文字列
     * @returns {stdgam.ColorWrapper} 生成されたインスタンス
     */
    mod(modStr){
        return new stdgam.ColorWrapper(`hsl(from ${this.s} ${modStr})`);
    }

    /**
     * HSLを利用してこのオブジェクトが保持する色の明度を増減させた色を作り,
     * これを保持する新しいインスタンスを返す.
     * @param {number} dh - 明度に加算する値 (負の数でもよい)
     * @returns {stdgam.ColorWrapper} 生成されたインスタンス
     */
    lighter(dh){
        return new stdgam.ColorWrapper(`hsl(from ${this.s} h s calc(l + ${dh}))`);
    }
}

/**
 * ColorWrapperオブジェクトを生成するためのショートカット.
 * new stdgam.ColorWrapper(colorStr)と等価である.
 * @param {string} colorStr - CSSの色指定文字列
 * @returns {stdgam.ColorWrapper} 生成されたインスタンス
 */
stdgam.colorOf = function(colorStr){
    return new stdgam.ColorWrapper(colorStr);
}

/**
 * ベースカラーに対する明度の相対変化によってグラデーションを生成するためのクラス.
 * インスタンス生成の段階では
 * - グラデーションの方向
 * - 色経由点 (ストップ) の位置
 * - 色経由点における明度の変化量 (HSLのL値に対する加算)
 *
 * だけを指定しておき, ベースカラーやサイズの情報はmakeメソッドを呼び出すときに指定する.
 *
 * ```
 * // 開始地点では明度+20%, 終了地点では明度-20%であるようなグラデーションを作る
 * const LG = new stdgam.LightGradation("NtoS", [0, 20], [1, -20]);
 *
 * // コンテキストやベースカラー, サイズはmakeメソッドの引数として与える
 * const g = LG.make(ctx, "yellow", 0, 0, 640, 480);
 * ctx.fillStyle = g;
 *
 * // 既存のキャンバスにブレンド合成する場合のショートカット
 * LG.blend(canvas, "yellow", "overlay", { alpha: 0.5 });
 * ```
 *
 * デザインが同じでベースカラーだけが違うグラデーションを作ったり, サイズの異なる領域に
 * 同じデザインのグラデーションを施す場合, 最初に1つのLightGradationオブジェクトを用意して
 * おいて, makeメソッドの引数だけ変更すれば目的を達成できる.
 * @class
 * @prop {Array<number[]>} stops - 色経由点の位置とその点における明度差分の組を並べた配列
 */
stdgam.LightGradation = class{
    #pos;

    /**
     * blendメソッドの処理で使うオフスクリーンキャンバスを管理するオブジェクト.
     * 呼び出しのたびにキャンバスを生成するのは無駄だから, 同じサイズのキャンバスが
     * 残っている場合はそれを再利用する.
     * @type {stdgam.CachePool}
     */
    static caches = new stdgam.CachePool();

    /**
     * 垂直方向（上から下へ）のグラデーションを指定するための文字列
     * @type {string}
     */
    static NtoS = "NtoS";

    /**
     * 斜め方向（左上から右下へ）のグラデーションを指定するための文字列
     * @type {string}
     */
    static NWtoSE = "NWtoSE";

    /**
     * 斜め方向（右上から左下へ）のグラデーションを指定するための文字列
     * @type {string}
     */
    static NEtoSW = "NEtoSW";

    /**
     * 水平方向（左から右へ）のグラデーションを指定するための文字列
     * @type {string}
     */
    static EtoW = "EtoW";

    /**
     * 各種のグラデーションにおける始点と終点の位置をまとめたオブジェクト.
     * ただし, 座標の値そのものを記述するではなく, 左上を (0,0), 右下を (1,1) とする
     * 「正規化された座標系」での位置を記述する.
     * @type {Object.<string,Object>}
     */
    static positionInfo = Object.freeze({
        NtoS: { sx: 0, sy: 0, tx: 0, ty: 1 },
        NWtoSE: { sx: 0, sy: 0, tx: 1, ty: 1 },
        NEtoSW: { sx: 1, sy: 0, tx: 0, ty: 1 },
        WtoE: { sx: 0, sy: 0, tx: 1, ty: 0 }
    });

    /**
     * 「グラデーションの方向」と「色経由点」を指定してインスタンスを生成する.
     * 第2引数以降には [色経由点の位置, 明度の変化量] の形のリストを任意の個数
     * 与えることができる.
     *
     * ```
     * // 最初と最後が明るくて, 真ん中が暗いグラデーションの場合
     * const LG = new stdgam.LightGradation("NWtoSE", [0, 25], [0.5, -25], [1, 25]);
     * ```
     *
     * @param {string} type - グラデーションの方向を表す文字列
     * @param {...number[]} stops - 色経由点の位置とその点における明度差分の組 (可変引数)
     */
    constructor(type, ...stops){
        this.#pos = stdgam.LightGradation.positionInfo[type];
        this.stops = stops;
    }

    /**
     * 指定された位置情報とベースカラーを元に, CanvasGradientオブジェクトを生成する.
     *
     * 【注意】グラデーションの始点・終点はCanvasGradientと同じ意味で用いている.
     * グラデーションのクリッピングが行われるわけではないので注意.
     * @param {CanvasRenderingContext2D} ctx - グラデーションの生成に用いるコンテキスト
     * @param {string} color - ベースカラー
     * @param {number} x1 - グラデーションの始点のx座標
     * @param {number} y1 - グラデーションの始点のy座標
     * @param {number} x2 - グラデーションの終点のx座標
     * @param {number} y2 - グラデーションの終点のy座標
     * @returns {CanvasGradient} 生成されたグラデーションオブジェクト
     */
    make(ctx, color, x1, y1, x2, y2){
        const w = x2 - x1;
        const h = y2 - y1;
        const g = ctx.createLinearGradient(
            this.#pos.sx * w + x1, this.#pos.sy * h + y1,
            this.#pos.tx * w + x1, this.#pos.ty * h + y1
        );
        for(const e of this.stops){
            g.addColorStop(e[0], stdgam.colorOf(color).lighter(e[1]));
        }
        return g;
    }

    /**
     * 指定されたキャンバスに対し, コンテキストのglobalCompositeOperationを用いて
     * グラデーションをブレンド合成する. ただし, 何も描かれていないピクセルに対しては
     * 変更を与えない (これにより, 余白に色が付いてしまうことを防止できる).
     *
     * 第4引数のoptを省略した場合, 始点(0,0), 終点(canvas.width, canvas.height)の
     * グラデーションを作成してこれをブレンドする (この場合, アルファ値を変更しない).
     *
     * 一方, 第4引数にオプションリストoptを与えた場合, グラデーションの位置や
     * アルファ値を変更できる. 設定できる値は次の通りである:
     * * x1 - グラデーションの始点のx座標 (省略時は0)
     * * y1 - グラデーションの始点のy座標 (省略時は0)
     * * x2 - グラデーションの終点のx座標 (省略時はcanvas.width)
     * * y2 - グラデーションの終点のy座標 (省略時はcanvas.height)
     * * alpha - 合成するときの不透明度 (省略時はコンテキストのglobalAlphaをそのまま使う)
     *
     * @param {HTMLCanvasElement} canvas - 合成対象のキャンバス
     * @param {string} color - ベースカラー
     * @param {string} mode - 合成モードを指定する文字列 ("overlay", "screen" など)
     * @param {Object.<string,*>} [opt={}] - オプションリスト
     */
    blend(canvas, color, mode, opt={}){
        const x1 = opt.x1 || 0;
        const y1 = opt.y1 || 0;
        const x2 = opt.x2 || canvas.width;
        const y2 = opt.y2 || canvas.height;
        const w = canvas.width;
        const h = canvas.height;
        const bufName = `${w}x${h}`;

        let buf = stdgam.LightGradation.caches.get(bufName);
        if(buf) buf.getContext("2d").clearRect(0, 0, w, h);
        else buf = stdgam.LightGradation.caches.createCache(bufName, w, h);

        const ctxBuf = buf.getContext("2d");
        ctxBuf.save();
        ctxBuf.drawImage(canvas, 0, 0);
        ctxBuf.globalCompositeOperation = "source-in";
        ctxBuf.fillStyle = this.make(ctxBuf, color, x1, y1, x2, y2);
        ctxBuf.fillRect(0, 0, w, h);
        ctxBuf.restore();

        const ctx = canvas.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation = mode;
        if(opt.alpha) ctx.globalAlpha = opt.alpha;
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
    }
}

/**
 * パス (図形の形状) を指定し, 背景の塗りつぶしやボーダー, グラデーションなどの装飾を
 * 組み合わせて図形を作成するためのクラス.
 * LightGradationクラスと同様, インスタンス生成後にmakeメソッドを呼び出すことで
 * 実際に図形が作られる.
 *
 * 指定できるパラメータは大きく4つに分かれる.
 * 1. 基本情報 (作成するキャンバスの幅, ボーダーの基準幅)
 * 2. パスの形状
 * 3. 背景に関する設定 (配色とグラデーション)
 * 4. ボーダーに関する設定 (ボーダーの種類と配色, グラデーション)
 *
 * 1.はmakeメソッドの引数width, height, lineWidthで指定する.
 * また, 2.はパスを作成するコールバック関数pathFnによりユーザーが自分で設定する.
 *
 * これに対し, 3.と4.のパラメータは配色リストcolorsに必要な値をセットして
 * コンストラクタに渡す.
 *
 * ```
 * // 例
 * const pool = new stdgam.CachePool();
 * const colors = {
 *     bg: "orange", bgBlend: "red",
 *     border: "red", borderInner: "white", borderBlend: "yellow"
 * }
 * const pathFn = (ctx, w, h, lineWidth) => {
 *     ctx.beginPath();
 *     ctx.roundRect(lineWidth/2, lineWidth/2, w-lineWidth, h-lineWidth, 0);
 * }
 *
 * const CB = new stdgam.ColorBox(colors, pathFn);
 * CB.make(pool, "OrangeRectangle", 640, 480, 8);
 * ```
 *
 * 配色リストにセットできるパラメータは下記の通り.
 * * bg - 背景の色
 * * bgBlend - 背景に重ねるグラデーションの色
 * * bgOp - 背景のグラデーションの合成モード (省略時は "soft-light")
 * * border - ボーダーの色. もしborderInnerが指定されている場合はボーダーの外側の色として使う
 * * borderInner - ボーダーを2色で描画するとき指定する. この値をボーダーの内側の色として使う
 * * borderBlend - ボーダーに施すグラデーションの色
 * * borderBlur - ボーダーをぼかすために重ねるシャドーの色
 * * borderOp - ボーダーのグラデーションの合成モード (省略時は "soft-light")
 * * clip - trueの場合, パスの内側に含まれる部分だけを描画する
 * * lighting - 指定された色の光源に斜めから照らされるようなエフェクトを付与する
 *
 * もしcolors.bgが未設定なら, 背景の塗りつぶしを行わない.
 * 同様に, colors.borderが未設定の場合はボーダーの描画を行わない.
 *
 * また, パスを設定する関数pathFnには, 既定の引数 (ctx, width, height, lineWidth) に加えて
 * 追加の引数を渡すことができる.
 *
 * ```
 * // pool, colorsは1つ目の例と同じとする
 * const pathFn = (ctx, w, h, lineWidth, radius) => {
 *     ctx.beginPath();
 *     ctx.roundRect(lineWidth/2, lineWidth/2, w-lineWidth, h-lineWidth, radius);
 * };
 *
 * const CB = new stdgam.ColorBox(colors, pathFn);
 * CB.make(pool, "OrangeRectangle", 640, 480, 8, 10);  // 引数radiusに10が代入される
 * ```
 *
 * @prop {Object.<string,*>} colors - 使用する配色リスト
 * @prop {function(CanvasRenderingContext2D, number, number, number, ...*): void} pathFn - 
 * パスの作成に用いる関数
 */
stdgam.ColorBox = class{
    static caches = new stdgam.CachePool();

    /**
     * コールバック関数pathFnによってパスを作成し, colorsの設定に基づいて
     * 図形の描画を実行するインスタンスを生成する.
     *
     * pathFnは以下の4つの引数
     * * ctx - パスを設定するコンテキスト
     * * width - キャンバスの横幅
     * * height - キャンバスの縦幅
     * * lineWidth - ボーダーの太さの基準値
     *
     * を受け取り, これらの情報に基づいてctxにパスを設定する関数である.
     * 通常は, ボーダーの太さを考慮し, 線がキャンバスの外にはみ出してしまわないように
     * 位置を調整してパスを作る必要がある.
     *
     * また, もし必要ならば, makeメソッドの第6引数以降を利用して追加の引数を
     * pathFnへ渡すこともできる.
     *
     * ```
     * const pool = new stdgam.CachePool();
     * const colors = { ... 略 ... };
     * const pathFn = (ctx, w, h, lineWidth, radius) => {
     *     ctx.beginPath();
     *     ctx.roundRect(lineWidth/2, lineWidth/2, w-lineWidth, h-lineWidth, radius);
     * };
     *
     * const CB = new stdgam.ColorBox(colors, pathFn);
     * CB.make(pool, "OrangeRectangle", 640, 480, 8, 10);  // 引数radiusに10が代入される
     * ```
     *
     * 「配色リスト」についてはColorBoxクラスのクラス説明を参照のこと.
     * @param {Object.<string,*>} colors - 配色リスト
     * @param {function(CanvasRenderingContext2D, number, number, number, ...*): void} pathFn - 
     * パスを作成するコールバック関数
     */
    constructor(colors, pathFn){
        this.colors = colors;
        this.pathFn = pathFn;
    }

    #getOrCreate(pool, name, w, h, reset=false){
        let c = pool.get(name);
        if(c && reset) c.getContext("2d").clearRect(0, 0, c.width, c.height);
        return c || pool.createCache(name, w, h);
    }

    #paintBody(canvas, ctx){
        ctx.save();
        ctx.fillStyle = this.colors.bg;
        if(this.colors.clip) ctx.clip();
        ctx.fill();
        if(this.colors.bgBlend){
            const blender = new stdgam.LightGradation("NtoS", [0, 70], [1, 0]);
            blender.blend(canvas, this.colors.bgBlend, this.colors.bgOp || "soft-light", {alpha:0.5});
        }
        ctx.restore();
    }

    #doubleStroke(ctx, color, lw, shadowClipFlag, shadowAlpha){
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
        if(shadowClipFlag) ctx.clip();
        ctx.shadowColor = color;
        ctx.shadowBlur = lw / 2;
        ctx.globalAlpha = shadowAlpha;
        ctx.stroke();
        ctx.restore();
    }

    #paintBorder(canvas, ctx, lineWidth, opt){
        const bufName = `${canvas.width}x${canvas.height}`;
        const buf = this.#getOrCreate(stdgam.ColorBox.caches, bufName, canvas.width, canvas.height, true);
        const ctxBuf = buf.getContext("2d");

        this.pathFn(ctxBuf, canvas.width, canvas.height, lineWidth, ...opt);
        this.#doubleStroke(
            ctxBuf, this.colors.border,
            lineWidth, true, 0.4
        );

        if(this.colors.borderBlur){
            ctxBuf.save();
            ctxBuf.lineWidth = 1;
            ctxBuf.strokeStyle = this.colors.border;
            ctxBuf.shadowColor = this.colors.borderBlur;
            ctxBuf.shadowBlur = lineWidth * 0.8;
            ctxBuf.stroke();
            ctxBuf.shadowBlur = lineWidth * 1;
            ctxBuf.globalCompositeOperation = "soft-light";
            ctxBuf.stroke();
            ctxBuf.restore();
        }

        if(this.colors.borderInner){
            this.#doubleStroke(ctxBuf, this.colors.borderInner, lineWidth / 2, false, 0.2);
        }

        if(this.colors.borderBlend){
            const blender = new stdgam.LightGradation("NtoS", [0, 80], [1, 0]);
            ctxBuf.save();
            ctxBuf.clip();
            blender.blend(buf, this.colors.borderBlend, this.colors.borderOp || "soft-light", {alpha: 0.8});
            ctxBuf.restore();
        }

        ctx.save();
        if(this.colors.clip){
            const tmp = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = Math.max(lineWidth / 3, 2);
            ctx.stroke();
            ctx.globalCompositeOperation = tmp;
            ctx.clip();
        }
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
    }

    #paintLighting(canvas, ctx){
        const blender = new stdgam.LightGradation("NWtoSE", [0, 50], [1, -50]);
        blender.blend(canvas, this.colors.lighting, "screen", {alpha:0.4});
        blender.blend(canvas, this.colors.lighting, "multiply", {alpha:0.4});
    }

    /**
     * 渡されたCachePoolを使ってキャンバスを作り, その中に図形を描画する.
     * @param {stdgam.CachePool} pool - キャンバスの作成に使うCachePool
     * @param {string} name - 作成するキャンバスの名前
     * @param {number} width - 作成するキャンバスの横幅
     * @param {number} height - 作成するキャンバスの縦幅
     * @param {number} lineWidth - ボーダーの太さの基準値 (strokeを実行するときの太さ)
     * @param {...*} opt - pathFnに渡す追加の引数 (可変引数)
     */
    make(pool, name, width, height, lineWidth, ...opt){
        const canvas = this.#getOrCreate(pool, name, width, height, true);
        const ctx = canvas.getContext("2d");

        this.pathFn(ctx, width, height, lineWidth, ...opt);
        if(this.colors.bg) this.#paintBody(canvas, ctx);
        if(this.colors.border) this.#paintBorder(canvas, ctx, lineWidth, opt);
        if(this.colors.lighting) this.#paintLighting(canvas, ctx);
        return canvas;
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
