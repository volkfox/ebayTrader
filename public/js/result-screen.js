// This class will represent the menu screen 

const url = 'http://127.0.0.1:3000/api';

class ResultScreen {

    constructor(container, menuInstance) {

        this.container = container; // #results DIV
        this.menuInstance = menuInstance; // calling parent app

        this.onGetQueries = this.onGetQueries.bind(this);
        this.addValueInput = this.addValueInput.bind(this);
        this.updateParams = this.updateParams.bind(this);

    }

    async onGetQueries() {

        const resultsDiv = document.querySelector('#results');
        resultsDiv.classList.remove('hidden');


        const screenDiv = document.querySelector('#screen');

        if (screenDiv !== null && !screenDiv.classList.contains('animated')) {
            screenDiv.classList.add('animated');
        } else {

            resultsDiv.innerHTML = ''; // clean up prior HTML
        }

        const response = await fetch(url, {
            mode: 'no-cors'
        });
        const items = await response.json();


        this.addValueInput(resultsDiv, items['queries']);
    }

    async onSaveQuery(container, remove) {

        console.log(container);

        const info = this.updateParams(container, remove);

        const response = await fetch(info.path, info.options);
        const json = await response.json();

        this.onGetQueries();
    }

    updateParams(container, remove) {

        let path = '';
        const method = 'PATCH';
        const options = {
            method: method
        };

        const bodyObj = {};

        const allValues = container.querySelectorAll('.body-Key');

        for (let i = 0; i < allValues.length; i++) {

            const input = allValues[i];
            const keyInput = input.classList[0].trim();
            let valueInput = '';

            if (keyInput === 'name') {
                valueInput = input.textContent.trim();
                path = '/api/' + valueInput;
            } else {

                if (keyInput === 'deployed') {

                    if (remove === "true") {
                        valueInput = "delete";
                    } else if (input.checked) {
                        valueInput = "true";
                    } else valueInput = "false";


                } else
                    valueInput = input.value.trim();
            }

            if (keyInput && valueInput) {
                bodyObj[keyInput] = valueInput;
            }
        }

        const bodySize = Object.keys(bodyObj).length;

        if (bodySize > 0) {
            options.body = JSON.stringify(bodyObj);
            options.headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
        }
        return {
            path, options
        };

    }


    addValueInput(resultsContainer, items) {

        console.log('Got items: ' + items); // hope to see queries

        const containerList = document.createElement('div');
        containerList.className = 'body-column';

        for (let i = 0; i < items.length; i++) {

            const container = document.createElement('div');
            container.className = 'body-row fld';

            const deployed = document.createElement('input');
            deployed.type = 'checkbox';
            deployed.className = 'deployed body-Key field-tip';
            if (items[i]['deployed'] === 'true') deployed.checked = true;
            else deployed.checked = false;

            const name = document.createElement('span');
            //name.type = 'text';
            name.className = 'name fld body-Key';
            name.innerHTML = items[i]['name'];
            //key.addEventListener('keyup', createRequestPreview);

            const keywords = document.createElement('input');
            keywords.type = 'text';
            keywords.title = "This is the text of the tooltip"

            keywords.className = 'keywords fld body-Key';
            keywords.value = items[i]['keywords'];

            const mPrice = document.createElement('input');
            mPrice.type = 'text';
            mPrice.className = 'mPrice fld body-Key';
            mPrice.value = items[i]['mPrice'];

            const xPrice = document.createElement('input');
            xPrice.type = 'text';
            xPrice.className = 'xPrice fld body-Key';
            xPrice.value = items[i]['xPrice'];

            const email = document.createElement('input');
            email.type = 'text';
            email.className = 'email fld body-Key';
            email.value = items[i]['email'];

            const categoryID = document.createElement('input');
            categoryID.type = 'text';
            categoryID.className = 'categoryID fld body-Key';

            if (items[i]['categoryID'] !== null)
                categoryID.value = items[i]['categoryID'];



            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className = 'removeButton fld';

            removeButton.addEventListener('click', () => {
                this.onSaveQuery(container, "true");
                // TBD delete the query
            });

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.className = 'saveButton';

            saveButton.addEventListener('click', () => {
                //container.remove();
                this.onSaveQuery(container, "false");
            });

            container.append(deployed);
            container.append(name);
            container.append(' : ');
            container.append(keywords);
            container.append(' : ');
            container.append(mPrice);
            container.append(' : ');
            container.append(xPrice);
            container.append(' : ');
            container.append(email);
            container.append(' : ');
            container.append(categoryID);
            container.append(' : ');

            container.append(saveButton);
            container.append(removeButton);

            containerList.append(container);
        }

        resultsContainer.append(containerList);
    }



    async onCreateQuery(event) {


        // TBD
    }
}
