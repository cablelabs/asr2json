var fs = require('fs');
var exports = module.exports = {};

exports.jsonConsol = function(fileName) {

//    fs.readFile(fileName, "utf8", function (error, contents) {
        //    var json = JSON.parse(fs.readFileSync('a50bk.371_533.json', 'utf8'));
        //    var json = JSON.parse(fs.readFileSync('asrpdf.json', 'utf8'));
        var json = JSON.parse(fs.readFileSync(fileName, 'utf8'));

//        var json = JSON.parse(contents, 'utf8');
        var text="";
        for( var i = 0; i<json.formImage["Pages"].length; i++) {
            var texts = json.formImage["Pages"][i]["Texts"];
            for( var j = 0; j<texts.length; j++) {
                var tempj = j;
                while ( j+1 < texts.length) {
                    if ( texts[j+1]["y"] == texts[tempj]["y"] ) {
                        json.formImage["Pages"][i]["Texts"][tempj]["R"][0]["T"] +=  json.formImage["Pages"][i]["Texts"][++j]["R"][0]["T"];
                        delete json.formImage["Pages"][i]["Texts"][j];
                    }
                    else if ( j+2 < texts.length && texts[j+2]["y"] == texts[tempj]["y"]) {
                        json.formImage["Pages"][i]["Texts"][tempj]["R"][0]["T"] +=  json.formImage["Pages"][i]["Texts"][++j]["R"][0]["T"] + json.formImage["Pages"][i]["Texts"][++j]["R"][0]["T"];
                        delete json.formImage["Pages"][i]["Texts"][j-1];
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
//    });
}