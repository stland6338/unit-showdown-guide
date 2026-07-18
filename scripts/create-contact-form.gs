/**
 * にじユニショーダウン観戦ガイド用のお問い合わせGoogleフォームを作成する。
 *
 * 使い方（1分）:
 * 1. https://script.google.com で新規プロジェクト → このコードを貼り付け
 * 2. createContactForm を実行（初回は権限承認）
 * 3. ログに出る「回答URL」を src/lib/config.ts の contactUrl に設定して push
 *
 * アルプススタンド2026 の「ご意見・情報提供箱」と同じ運用パターン。
 */
function createContactForm() {
  const form = FormApp.create("にじユニショーダウン観戦ガイド お問い合わせ箱");
  form.setDescription(
    "非公式ファンサイト「にじユニショーダウン 非公式観戦ガイド」へのお問い合わせフォームです。\n" +
      "掲載内容の誤りの指摘・情報提供・権利に関するご連絡にご利用ください。\n" +
      "権利者様からのご連絡には確認のうえ速やかに対応します。"
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setAcceptingResponses(true);

  form
    .addMultipleChoiceItem()
    .setTitle("お問い合わせの種類")
    .setChoiceValues(["掲載内容の誤りの指摘", "情報提供", "権利に関するご連絡", "その他"])
    .setRequired(true);

  form.addParagraphTextItem().setTitle("内容").setHelpText("該当ページのURLがあれば併記してください").setRequired(true);

  form
    .addTextItem()
    .setTitle("返信先（任意）")
    .setHelpText("返信が必要な場合のみ、メールアドレスまたはXアカウントをご記入ください");

  Logger.log("編集URL: " + form.getEditUrl());
  Logger.log("回答URL: " + form.getPublishedUrl());
}
