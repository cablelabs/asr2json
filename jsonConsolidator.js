var fs = require('fs');

fs.readFile('asrpdf.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    for( var i = 0; i<5; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var R = texts[j]["R"];
            var T = R[0]["T"];

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
            console.log(T);
        }
    }
    fs.writeFile("newjsonfile.json", JSON.stringify(json, null, 4), function(err) {
        if (err) {
            return console.log(err);
        }
    })
});