# nagibato
a tiny simulator of "MAGICARD BATTLE"

## 概略
昔アーケードで稼働していた『MAGICARD BATTLE』（[https://madoka-magica-mg.sega.jp/](https://madoka-magica-mg.sega.jp/)）というカードゲームのシミュレータです. どちらかというと, MAGICARD BATTLEのルールや仕様に関する「動く記録資料」を作ることを目的としています.

<span style="color:red; font-weight:bold">☆ GitHub Pagesで試遊できます！　→</span>　https://lenuser-code.github.io/nagibato/nagibato.html


## ファイル構造 ([docs](https://lenuser-code.github.io/nagibato/docs/))
* [nagibato.html](https://github.com/lenuser-code/nagibato/blob/main/nagibato.html) - ゲームを実行するHTMLファイル
* [nagibato.js](https://github.com/lenuser-code/nagibato/blob/main/nagibato.js) - メイン部分
* [stdgam.js](https://github.com/lenuser-code/nagibato/blob/main/stdgam.js) - いわゆるゲームエンジン部分
* [stdtask.js](https://github.com/lenuser-code/nagibato/blob/main/stdtask.js) - 頻出するタスクは抽出してここに置くつもり
* [cardlist.js](https://github.com/lenuser-code/nagibato/blob/main/cardlist.js) - 全カードデータ（実質的にはJSONファイル）
* [card.js](https://github.com/lenuser-code/nagibato/blob/main/card.js) - カードに関連するオブジェクトの実装 (プレイヤー側スキルも含む)
* [enemy.js](https://github.com/lenuser-code/nagibato/blob/main/enemy.js) - 敵スキルの実装, および敵ステータスの管理
* [model.js](https://github.com/lenuser-code/nagibato/blob/main/model.js) - プレイヤーおよび敵を表すクラスを実装
* [QB.js](https://github.com/lenuser-code/nagibato/blob/main/QB.js) - システムメッセージ, およびチュートリアルに関する実装
* [edit.js](https://github.com/lenuser-code/nagibato/blob/main/edit.js) - デッキ編集画面
* [config.js](https://github.com/lenuser-code/nagibato/blob/main/config.js) - 設定画面
* [battle.js](https://github.com/lenuser-code/nagibato/blob/main/battle.js) - バトル画面
* [storage.js](https://github.com/lenuser-code/nagibato/blob/main/storage.js) - localStorageに関する機能の実装

ちなみに全カードデータはEverNoteにてJSONファイルとして公開しています：
https://lite.evernote.com/note/2f492959-5c8b-85a8-cab4-281cfebac469

## Acknowledgement
This simulator uses ZzFX (https://github.com/KilledByAPixel/ZzFX). I would like to express my gratitude to the ZzFX project and its community.

<br>
<pre>
2026 @lenuser
</pre>
---
