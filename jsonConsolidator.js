var fs = require('fs');

fs.readFile('asrpdf.json', 'utf8', module.exports = function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    var text="";
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var tempj = j;
            while ( j+1 != texts.length) {
                if ( texts[j+1]["y"] == texts[tempj]["y"] ) {
                    json.formImage["Pages"][i]["Texts"][tempj]["R"][0]["T"] +=  json.formImage["Pages"][i]["Texts"][++j]["R"][0]["T"];
                    delete json.formImage["Pages"][i]["Texts"][j];
                }
                else {
                    break;
                }
            }
            if (text == "") {
                text = String(json.formImage["Pages"][i]["Texts"][tempj]["R"][0]["T"]);
                continue;
            }

            text = text + "\n" + decodeURIComponent(json.formImage["Pages"][i]["Texts"][tempj]["R"][0]["T"]);
        }
    }
    var wstream = fs.createWriteStream('textalone');
    wstream.write(text);
    wstream.end();
});
//module.exports.jsonConsol = jsonConsol;