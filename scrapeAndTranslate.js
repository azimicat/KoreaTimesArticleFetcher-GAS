function scrapeAndTranslate() {
  var url = 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml'; // XMLデータのURL
  var response = UrlFetchApp.fetch(url);
  var xml = response.getContentText();

  var document = XmlService.parse(xml);
  var root = document.getRootElement();

  // channel要素を取得
  var channel = root.getChild('channel');

  // channel内の全てのitem要素を取得
  var items = channel.getChildren('item');

  // 各item要素からtitle,url,descriptionを取得
  var itemsBundle = items.map(function (item) {
    var titleElement = item.getChild('title');
    var linkElement = item.getChild('link');
    var descriptionElement = item.getChild('description');
    var pubDateElement = item.getChild('pubDate');
    var title = titleElement ? titleElement.getText() : '';
    var link = linkElement ? linkElement.getText() : '';
    var description = descriptionElement ? descriptionElement.getText() : '';
    var pubDate = pubDateElement ? convertToKST(pubDateElement.getText()) : '';
    return { title: title, link: link, description: description, pubDate: pubDate };
  });

  // シートを取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // シート全体をクリア
  resetSpreadsheet(sheet);

  // スプレッドシートに追記
  setDataToSpreadsheet(sheet, itemsBundle);
}

function convertToKST(dateString) {
  // 日時をパースしてUTCのDateオブジェクトを作成
  var date = new Date(dateString);

  // 韓国標準時（KST）のタイムゾーンを設定
  var options = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  };

  // Dateオブジェクトを韓国標準時（KST）のフォーマットに変換
  var kstFormatted = new Intl.DateTimeFormat('ja-JP', options).format(date);

  // フォーマットを「yyyy/mm/dd h:m timezone」に整える
  kstFormatted = kstFormatted.replace(/\//g, '-') + ' KST';  // '/'を'-'に変換し、「KST」を追加
  return kstFormatted;
}


function setDataToSpreadsheet(sheet, items) {
  var lastRow = sheet.getLastRow();
  // 項目名挿入
  sheet.getRange(lastRow + 1, 1).setValue('title');
  sheet.getRange(lastRow + 1, 2).setValue('translated title');
  sheet.getRange(lastRow + 1, 3).setValue('description');
  sheet.getRange(lastRow + 1, 4).setValue('pubDate');
  sheet.getRange(lastRow + 1, 5).setValue('link');

  items.forEach((item) => {
    var lastRow = sheet.getLastRow();
    // データ挿入
    sheet.getRange(lastRow + 1, 1).setValue(item.title);
    sheet.getRange(lastRow + 1, 2).setFormula('=GOOGLETRANSLATE(A' + (lastRow + 1) + ',"ko","ja")');
    sheet.getRange(lastRow + 1, 3).setValue(item.description);
    sheet.getRange(lastRow + 1, 4).setValue(item.pubDate);
    sheet.getRange(lastRow + 1, 5).setValue(item.link);
  })
}

function resetSpreadsheet(sheet) {
  // 内容と書式の両方をクリア
  sheet.clear();
}


