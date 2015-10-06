# asr2json

> **IMPORTANT**: This project is in pre-release development. Please expect frequent changes and updates while we converge on our initial release.

asr2json is a converter that takes in the [ATIS](http://www.atis.org/) Access Service Ordering Guildlines (ASOG) PDF specification and produces JSON.

More specifically, asr2json converts Access Service Request (ASR) Form Preparation Guides in PDF format to JSON, similar to the following (represents a single field):

```
{
  "asogVersion": "50",
  "processed": "2015-07-14T18:25:43.511Z",
  "form": "FORM",
  "section": "SECTION",
  "name": "Example Field Name",
  "title": "EFN",
  "fieldNumber": "001",
  "fieldLength": "3",
  "characteristics": "Alpha",
  "usage": "Required",
  "example": "ABC",
  "definition": "An exmaple field that serves as an example for this example.",
  "validEntry": [
    {
      "value": "ABC",
      "description": "One example."
    },
    {
      "value": "XYZ",
      "description": "Another example."
    }
  ],
  "validEntryNotes": [
    "Any three character alpha string."
  ],
  "usageNotes": [
    "A usage note."
  ],
  "fieldNotes": [
    "A general field note.",
    "Another field note about how this field relates to another field.",
    "One last field note."
  ],
  "errors": []
}
```

asr2json is meant to convert valid copies of the [Access Service Ordering Guidelines (ASOG)](http://www.atis.org/obf/download.asp) that have been properly purchased from ATIS.

For more information about the converter, please visit the [asr2json wiki](https://github.com/cablelabs/asr2json/wiki).

##Setup

###Install Node.js

To check if Node.js is already installed or to check if it has been installed correctly:
```
node -v
```
If you're installing Node.js for the first time, please see: https://nodejs.org/

###Install pdftotextjs module

At this time, you need to install the [pdftotextjs](https://github.com/fagbokforlaget/pdftotextjs) module globally.
```
sudo npm install pdftotextjs -g
```

###Clone the repository
Use the `cd` command to navigate to the desired directory. Clone the git repository (git required):

```
git clone https://github.com/cablelabs/asr2json.git
```

##Run
```
cd asr2json
node asr2json.js path-to-asr.pdf path-to-output-directory start-page stop-page 
```

This is the command to run asr2json from the terminal. Replace fileName with the name of the pdf containing the spec. Replace start-page and end-page with the pages from the pdf which you want to be converted.  A directory matching the form name will be created in the output directory specified, and that form directory will contain json files matching the field names.  The output directory will be created if it doesn't exist.

##Require
asr2json isn't published to npm, so to require it in node, you will need to clone the repo inside of your node_modules directory

from within your project:
```
cd node_modules
git clone https://github.com/cablelabs/asr2json.git
```

## Contributing

asr2json was originally built by [CableLabs](http://cablelabs.com/), but we could use your help! Check out our [contributing guidelines](CONTRIBUTING.md) to get started.

## Other important stuff

We use an [MIT License](https://github.com/cablelabs/asr2json/blob/master/LICENSE.md).

Questions? Just send us an email at btech@cablelabs.com.
