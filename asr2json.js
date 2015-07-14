var fs = require('fs');

fs.readFile('asr.json', 'utf8', function(err, data) {
    if (err) {
        throw err;
    }
    var json = JSON.parse(data);
    for( var i = 0; i<json.formImage["Pages"].length; i++) {
        var texts = json.formImage["Pages"][i]["Texts"];
        for( var j = 0; j<texts.length; j++) {
            var R = texts[j]["R"];
            for( var k = 0; k<R.length; k++) {
                var T = R[k]["T"];
                console.log(T);
            }
        }
    }
});