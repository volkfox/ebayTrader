const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// String ID for GSA spreadsheet
const SPREADSHEET_ID = '1qpiScZgu4MBfp9dUgkkDw9-GlO6PeQBqtCghBIZUm2Q';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

/*                                                  */
/* helper function block                            */
/*                                                  */

/* converts array of arrays into array of JS objects */
function objectConvert(rows, columns) {

    returnObj = [];
    // skip first row of table headers
    for (let i = 1; i < rows.length; i++) {

        let object = {};
        for (let j = 0; j < rows[i].length; j++)
            object[columns[j]] = rows[i][j];

        returnObj.push(object);
    }
    return returnObj;
}

/* returns index of first document matching value in given column */
function documentFind(rows, columnIndex, value) {

    // skip first row of headers
    for (let i = 1; i < rows.length; i++) {

        // note: this version treats values as case-sensitive
        // to alter it, use rows[i][columnIndex].toLowerCase()
        if (rows[i][columnIndex] === value) return i;
    }
    return 0;
}

/* reads the spreadsheet in a helper function for code clarity */
async function readSheet() {
    const result = await sheet.getRows();
    return result.rows;
}

/* locates a first spreadsheet matching a given C-V pair         */
/* returns: row#, or (-1) if C-V not found, or (-2) if wrong C   */
function findRowIndex(reqColumn, reqValue, rows) {

    let columnNames = rows[0];
    let columnIndex = columnNames.findIndex(elem => elem.toLowerCase() === reqColumn);

    if (columnIndex >= 0) { // valid column index was supplied

        let rowIndex = documentFind(rows, columnIndex, reqValue);

        if (rowIndex === 0) { // valid row not found
            return -1;
        } else { // valid row, return index
            return rowIndex;
        }
    } else { // could not find the column, aborting delete ops
        return -2;
    }
}

/* build up return values for an update attempt */
/* returns JSON status object                   */
async function performUpdate(rowIndex, reqColumn, reqValue, updateFunc) {

    switch (rowIndex) {
        case -1:
            return ({
                status: `Attribute-value pair {${reqColumn}:${reqValue}} not found in any row`
            });
            break;
        case -2:
            return ({
                status: `Column {${reqColumn}} not found in spreadsheet`
            });
            break;
        default:
            const status = await updateFunc(rowIndex);
            return status;
    }
}

/* function to kill a row already found  */
async function deleteRow(rowIndex) {

    const deleteStatus = await sheet.deleteRow(rowIndex);
    return deleteStatus;
}

/* wrapper that makes a patch function given AV pairs to change */
function createPatch(rows, messageBody) {

    async function patchRow(rowIndex) {

        const newRow = rows[rowIndex];
        const columnNames = rows[0];

        const updateKeys = Object.keys(messageBody);

        for (let i = 0; i < updateKeys.length; i++) {

            let columnIndex = columnNames.findIndex(elem => elem.toLowerCase() === updateKeys[i].toLowerCase());

            if (columnIndex < 0) console.log(`Warning: key {${updateKeys[i]}} not found, ignoring`);

            newRow[columnIndex] = messageBody[updateKeys[i]];
        }

        const setStatus = await sheet.setRow(rowIndex, newRow);
        return setStatus;
    }

    return patchRow; // return currying function
}

/*                           */
/* helper function block end */
/*                           */

async function onGet(req, res) {

    const rows = await readSheet(sheet);
    const columns = rows[0];
    res.json(objectConvert(rows, columns));
}
app.get('/api', onGet);

/* case-insensitive for column names, preserves case in values */
async function onPost(req, res) {

    const messageBody = req.body;
    const messageKeys = Object.keys(messageBody);
    const rows = await readSheet(sheet);
    const columns = rows[0];

    let newRow = []; // this will be our new row to add

    // bail out if the number of fields does not a match sheet 
    if (columns.length != messageKeys.length) {

        res.json({
            status: `${messageKeys.length} keys supplied while spreadsheet has ${columns.length} columns`
        });
        return;
    }

    // otherwise cycle over all columns and find them in body
    for (let i = 0; i < columns.length; i++) {

        let messageIndex = messageKeys.findIndex(elem => elem.toLowerCase() === columns[i].toLowerCase());

        if (messageIndex < 0) { // no match in body, bail out

            res.json({
                status: `Did not find column {${columns[i]}}`
            });
            return;
        }

        // else key was found, add the value to the entry
        newRow.push(messageBody[messageKeys[messageIndex]]);
    }

    // try appending this new row
    const appendStatus = await sheet.appendRow(newRow);
    res.json(appendStatus);
}

app.post('/api', jsonParser, onPost);


/* case-insensitive version of patch  */
async function onPatch(req, res) {

    const reqColumn = req.params.column.toLowerCase();
    const reqValue = req.params.value;
    //const reqValue = req.params.value.toLowerCase();
    const rows = await readSheet(sheet);
    const columnNames = rows[0];

    const messageBody = req.body;

    let rowIndex = findRowIndex(reqColumn, reqValue, rows);

    patchRow = createPatch(rows, messageBody); // curry function

    updateObject = await performUpdate(rowIndex, reqColumn, reqValue, patchRow);

    res.json(
        updateObject
    );
}

app.patch('/api/:column/:value', jsonParser, onPatch);


/* case-insensitive for column names and row values */
async function onDelete(req, res) {

    const reqColumn = req.params.column.toLowerCase();
    const reqValue = req.params.value;
    //const reqValue = req.params.value.toLowerCase();
    const rows = await readSheet(sheet);
    const columnNames = rows[0];

    let rowIndex = findRowIndex(reqColumn, reqValue, rows);

    updateObject = await performUpdate(rowIndex, reqColumn, reqValue, deleteRow);

    res.json(
        updateObject
    );
}

app.delete('/api/:column/:value', onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`CS193x: Server listening on port ${port}!`);
});
