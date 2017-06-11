// This class will represent the menu screen 

const url = 'http://127.0.0.1:3000/api';

class ResultScreen {

    constructor(container, menuInstance) {

        this.container = container; // #results DIV
        this.menuInstance = menuInstance; // calling parent app

        this.onGetQueries = this.onGetQueries.bind(this);
        this.addValueInput = this.addValueInput.bind(this);
        this.updateParams = this.updateParams.bind(this);
        this.activateTab1 = this.activateTab1.bind(this);
        this.activateTab2 = this.activateTab2.bind(this);
        this.switchTab = this.switchTab.bind(this);
    }


    async onSaveQuery(container) {

        console.log(container);

        const info = this.updateParams(container, "false", 'PATCH');

        const response = await fetch(info.path, info.options);
        const json = await response.json();

        this.onGetQueries();
    }

    async onRemoveQuery(container) {

        console.log(container);

        const info = this.updateParams(container, "true", 'PATCH');

        const response = await fetch(info.path, info.options);
        const json = await response.json();

        this.onGetQueries();
    }


    async onTryQuery(container) {

        console.log(container);

        const info = this.updateParams(container, "false", 'POST');

        const response = await fetch(info.path, info.options);
        const json = await response.json();

        let list = json["findCompletedItemsResponse"][0]['searchResult'][0];

        let itemNumber = list['@count'];

        console.log("Items reported in trial query: " + itemNumber);

        //const itemList = document.createElement('div');
        //itemList.className = 'item-list';

        const resultsDiv = document.querySelector('#searches');
        resultsDiv.innerHTML = '';

        let counterText = document.createElement('SPAN');
        if (itemNumber === '100') itemNumber = '100+';
        counterText.textContent = 'Found ' + itemNumber + ' sold items ';
        counterText.className = "counterText";
        resultsDiv.append(counterText);

        if (itemNumber != "0") {

            let items = list['item']; // array of search results

            for (let j = 0; j < items.length; j++) {

                const itemBlock = document.createElement('div');
                itemBlock.className = 'item-block';

                let itemUrl = items[j]['viewItemURL'][0];
                let itemTitle = items[j]['title'][0];

                let itemPrice = items[j]['sellingStatus'][0]['currentPrice'][0]['__value__'];

                let imgUrl = '';

                if ('galleryURL' in items[j]) {

                    imgUrl = items[j]['galleryURL'][0];

                } else {
                    imgUrl = "../pics/sold.png";
                }

                let linkAddress = document.createElement('a');
                let linkText = document.createTextNode('  ' + itemTitle);

                linkAddress.appendChild(linkText);
                linkAddress.href = itemUrl;
                linkAddress.target = "_blank";

                let itemIcon = document.createElement('IMG');
                itemIcon.src = imgUrl;
                itemIcon.alt = '$' + itemPrice;
                itemIcon.title = '$' + itemPrice;

                let itemText = document.createElement('SPAN');
                itemText.textContent = '$' + itemPrice;
                itemText.className = "price";

                let textDiv = document.createElement('div');
                textDiv.className = 'textDiv';
                textDiv.append(linkAddress);
                textDiv.append(itemText);

                itemBlock.append(itemIcon);

                itemBlock.append(textDiv);

                //itemList.append(itemBlock);
                resultsDiv.append(itemBlock);
            }
        }
        //const resultsDiv = document.querySelector('#searches');
        //resultsDiv.append(itemList);
    }


    updateParams(container, remove, method) {

        let path = '/api';

        const options = {
            method: method
        };

        const bodyObj = {};

        const allValues = container.querySelectorAll('.body-Key');

        for (let i = 0; i < allValues.length; i++) {

            const input = allValues[i];
            const keyInput = input.classList[0].trim();
            let valueInput = '';

            if (keyInput === 'name' && method !== 'POST') {

                valueInput = input.textContent.trim();

                if (valueInput === '') {
                    valueInput = input.value.trim();
                }

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


    activateTab1() {

        const button1 = document.querySelector('#button1');
        const button2 = document.querySelector('#button2');
        this.switchTab(button2, button1);

    }

    activateTab2() {

        const button1 = document.querySelector('#button1');
        const button2 = document.querySelector('#button2');
        this.switchTab(button1, button2);

    }

    switchTab(button1, button2) {

        button1.classList.remove('active');
        button1.classList.add('passive');

        button2.classList.remove('passive');
        button2.classList.add('active');
    }

    addValueInput(resultsContainer, items, newQuery) {

        console.log('Got items: ' + items); // hope to see queries

        const containerList = document.createElement('div');
        containerList.className = 'body-column';

        for (let i = 0; i < items.length; i++) {

            const container = document.createElement('div');
            container.className = 'body-row';

            const deployed = document.createElement('input');
            deployed.type = 'checkbox';
            deployed.className = 'deployed body-Key field-tip';
            if (items[i]['deployed'] === 'true') deployed.checked = true;
            else deployed.checked = false;
            deployed.title = "enable/disable query";

            let name = document.createElement('div');

            if (newQuery === 'true') {

                name = document.createElement('input');
                name.type = 'text';
                name.title = 'query name';
                name.placeholder = 'query name';

                name.pattern = ".{1}.*";
                name.required = "required";

            }
            name.className = 'name fld body-Key';
            name.innerHTML = items[i]['name'];


            const keywords = document.createElement('input');
            keywords.type = 'text';
            keywords.title = "eBay search terms, e.g. harry potter +dvd -shoes";
            keywords.className = 'keywords fld body-Key';
            keywords.value = items[i]['keywords'];
            keywords.placeholder = 'ebay search parameters';
            keywords.pattern = ".{1}.*";
            keywords.required = "required";

            const mPrice = document.createElement('input');
            mPrice.type = 'text';
            mPrice.className = 'mPrice fld body-Key';
            mPrice.value = items[i]['mPrice'];
            mPrice.title = "minimum price, USD";
            mPrice.placeholder = 'min';
            mPrice.pattern = "[0-9]*";
            mPrice.required = "required";

            const xPrice = document.createElement('input');
            xPrice.type = 'text';
            xPrice.className = 'xPrice fld body-Key';
            xPrice.value = items[i]['xPrice'];
            xPrice.title = "maximum price, USD";
            xPrice.pattern = "[0-9]+";
            xPrice.placeholder = 'max price';
            xPrice.pattern = "[0-9]*";
            xPrice.required = "required";

            const email = document.createElement('input');
            email.type = 'email';
            email.className = 'email fld body-Key';
            email.value = items[i]['email'];
            email.title = "e-mail for notifications";
            email.placeholder = 'enter destination e-mail';
            email.required = "required";

            const categoryID = document.createElement('input');
            categoryID.type = 'text';
            categoryID.className = 'categoryID fld body-Key';
            categoryID.title = "eBay category, e.g. 111422";
            categoryID.placeholder = 'optional eBay category';

            if (items[i]['categoryID'] !== null)
                categoryID.value = items[i]['categoryID'];



            const removeButton = document.createElement('button');

            if (newQuery === 'true') {

                removeButton.textContent = 'Try it!';
                removeButton.className = 'tryButton';
                removeButton.title = 'run this query';

                // trying a search here
                removeButton.addEventListener('click', () => {
                    this.onTryQuery(container);
                });


            } else {


                removeButton.textContent = 'Remove';
                removeButton.className = 'removeButton';
                removeButton.title = "remove this query";

                removeButton.addEventListener('click', () => {
                    this.onRemoveQuery(container);

                });

            }

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.className = 'saveButton';
            saveButton.title = "save this query in DB";

            saveButton.addEventListener('click', () => {
                this.onSaveQuery(container);
            });

            container.append(deployed);
            container.append(name);
            //container.append(' : ');
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

            container.addEventListener("submit", function (e) {
                e.preventDefault();
            });

            containerList.append(container);


        } // end cycle

        resultsContainer.append(containerList);
    }


    async onCreateQuery(event) {

        this.activateTab1();

        const resultsDiv = document.querySelector('#results');
        resultsDiv.classList.remove('hidden');

        const rowDiv = document.querySelector('#rows');
        const screenDiv = document.querySelector('#screen');

        if (screenDiv !== null && !screenDiv.classList.contains('animated')) {
            screenDiv.classList.add('animated');
        } else {
            rowDiv.innerHTML = '';

            //resultsDiv.innerHTML = ''; // clean up prior HTML
        }

        let object = {
            name: "",
            keywords: "",
            mPrice: "",
            xPrice: "",
            email: "",
            categoryID: ""
        };

        let queries = [];
        queries.push(object);


        this.addValueInput(rowDiv, queries, 'true');
    }

    async onGetQueries() {

        this.activateTab2();

        const resultsDiv = document.querySelector('#results');
        resultsDiv.classList.remove('hidden');

        const searchDiv = document.querySelector('#searches');
        const rowDiv = document.querySelector('#rows');

        const screenDiv = document.querySelector('#screen');

        if (screenDiv !== null && !screenDiv.classList.contains('animated')) {
            screenDiv.classList.add('animated');
        } else {

            //resultsDiv.innerHTML = ''; // clean up prior HTML
            searchDiv.innerHTML = ''; // clean up prior HTML
            rowDiv.innerHTML = ''; // clean up prior HTML
        }

        const response = await fetch(url, {
            mode: 'no-cors'
        });
        const items = await response.json();


        this.addValueInput(rowDiv, items['queries'], 'false');
    }
}
