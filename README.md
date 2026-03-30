# nagibato
a tiny simulator of "MAGICARD BATTLE"

## 概略
昔アーケードで稼働していた『MAGICARD BATTLE』（[https://madoka-magica-mg.sega.jp/](https://madoka-magica-mg.sega.jp/)）というカードゲームのシミュレータです. どちらかというと, MAGICARD BATTLEのルールや仕様に関する「動く記録資料」を作ることを目的としています.

☆ GitHub Pagesで試遊できます！　→　https://lenuser-code.github.io/nagibato/nagibato.html


## ファイル構造 ([docs](https://lenuser-code.github.io/nagibato/docs/))
* [nagibato.html](https://lenuser-code.github.io/nagibato/nagibato.html) - ゲームを実行するHTMLファイル
* [nagibato.js](https://lenuser-code.github.io/nagibato/docs/nagibato.js.html) - メイン部分
* [stdgam.js](https://lenuser-code.github.io/nagibato/docs/stdgam.js.html) - いわゆるゲームエンジン部分
* [stdtask.js](https://lenuser-code.github.io/nagibato/docs/stdtask.js.html) - 頻出するタスクは抽出してここに置くつもり
* [card.js](https://lenuser-code.github.io/nagibato/docs/card.js.html) - カードに関連するオブジェクトの実装 (プレイヤー側スキルも含む)
* [enemy.js](https://lenuser-code.github.io/nagibato/docs/enemy.js.html) - 敵スキルの実装, および敵ステータスの管理
* [model.js](https://lenuser-code.github.io/nagibato/docs/model.js.html) - プレイヤーおよび敵を表すクラスを実装
* [QB.js](https://lenuser-code.github.io/nagibato/docs/QB.js.html) - システムメッセージ, およびチュートリアルに関する実装
* [edit.js](https://lenuser-code.github.io/nagibato/docs/edit.js.html) - デッキ編集画面
* [config.js](https://lenuser-code.github.io/nagibato/docs/config.js.html) - 設定画面
* [battle.js](https://lenuser-code.github.io/nagibato/docs/battle.js.html) - バトル画面
* [storage.js](https://lenuser-code.github.io/nagibato/docs/storage.js.html) - localStorageに関する機能の実装

ちなみに全カードデータはEverNoteにてJSONファイルとして公開しています：
https://lite.evernote.com/note/2f492959-5c8b-85a8-cab4-281cfebac469

## Acknowledgement
This simulator uses ZzFX (https://github.com/KilledByAPixel/ZzFX). I would like to express my gratitude to the ZzFX project and its community.

<br>
<pre>
2026 @lenuser
</pre>
---
