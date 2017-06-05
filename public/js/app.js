// This class will represent the music visualizer as a whole


class App {
    constructor() {

        console.log("Constructing an app..");


        let resultSheet = document.getElementById('results');
        this.result = new ResultScreen(resultSheet, this);

        let addButton = document.getElementById('button1');

        addButton.addEventListener('click', function () {
            event.preventDefault();
            this.result.onCreateQuery();
            console.log("creating query!");
        }.bind(this));

        addButton = document.getElementById('button2');

        addButton.addEventListener('click', function () {
            event.preventDefault();
            this.result.onGetQueries();
            console.log("dumping queries!");
        }.bind(this));

    }
}
