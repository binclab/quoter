const endpoint = "https://oauth2.googleapis.com/";
const client_id = '167979643861-c206l9c0vhor77mgveujailnleklgiad.apps.googleusercontent.com';
const api_key = 'AIzaSyDtkyr1CEHyR_doXiwV2sUTwHT9Xv85RO8';
const client_secret = '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';
const discovery_docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const redirect_uri = "localhost:8000"
//const scopes = 'https://www.googleapis.com/auth/drive';
//const discovery_docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const years = ['2022'];
const sub = "106525389156823461102";
var profile = {};

function setupLogin() {
    if (window.location.href.split('?')[1] === undefined) {
        document.getElementById("loginButton").style.display = "flex";
        document.getElementById("googleImage").setAttribute("class", "spin");
    }
    try {
        const array = window.location.href.split('?')[1].split('&')[0].split('=');
        if (array[0] === "code" && array[1] !== null) {
            fetch(endpoint + "token?grant_type=authorization_code&client_id=" +
                client_id + "&client_secret=" + client_secret + "&redirect_uri=http%3A//" +
                redirect_uri + "&code=" + array[1], {
                method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' },
            }).then(response => response.json()).then(json => {
                profile.access_token = json.access_token;
                profile.id_token = json.id_token;
                profile.refresh_token = json.refresh_token;
                fetch(endpoint + "tokeninfo?id_token=" + json.id_token, {
                    method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
                }).then(response => response.json()).then(json => {
                    profile.email = json.email;
                    profile.sub = json.sub;
                    if (profile.sub === sub) {
                        localStorage.profile = JSON.stringify(profile);
                        document.getElementById("login").style.display = "none";
                        document.getElementById("content").style.display = "block";
                        document.getElementById("dashboard").style.display = "block";
                    } else {
                        alert("Use the Rock Show Gmail Account!");
                    }
                });
            });
        }
    } catch (error) { }
}

function setupDashboard() {
    profile = JSON.parse(localStorage.profile);
    document.getElementById("login").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("dashboard").style.display = "block";
    try {
        fetch(endpoint + "tokeninfo?id_token=" + profile.id_token, {
            method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
        }).then(response => response.json()).then(json => {
            if (json.error === "invalid_token") {
                fetch(endpoint + "token?grant_type=refresh_token&client_id=" + client_id +
                    "&client_secret=" + client_secret + "&refresh_token=" + profile.refresh_token, {
                    method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
                }).then(response => response.json()).then(json => {
                    profile.access_token = json.access_token;
                    profile.id_token = json.id_token;
                    localStorage.profile = JSON.stringify(profile);
                });
            }
            setupGoogleDrive();
        });

    } catch (error) { }
    finally {
        //getFiles();
    }
}

function login() {
    window.location = "https://accounts.google.com/o/oauth2/v2/auth?" +
        "response_type=code&include_granted_scopes=true&access_type=offline&" +
        "client_id=" + client_id + "&redirect_uri=http%3A//" + redirect_uri + "&" +
        "scope=https%3A%2F%2Fwww.googleapis.com/auth/drive%20openid%20profile%20email&" +
        "login_hint=rockshowholdings";
}

function logout() {
    localStorage.removeItem("profile");
    profile = {};
    document.getElementById("login").style.display = "flex";
    document.getElementById("content").style.display = "none";
    document.getElementById("loginButton").style.display = "flex";
    document.getElementById("googleImage").setAttribute("class", "spin");
}

async function setupGoogleDrive() {
    gapi.load('client', await gapi.client.init({
        apiKey: api_key,
        discoveryDocs: [discovery_docs],
    }));
}

async function initializeGapiClient() {
    /*
    try {
        fetch("https://www.googleapis.com/drive/v3/files" + "tokeninfo?id_token=" + profile.id_token, {
            method: 'GET', headers: { 'Accept': 'application/x-www-form-urlencoded' }
        }).then(response => response.json()).then(json => {
            if (json.error === "invalid_token") {
                fetch(endpoint + "token?grant_type=refresh_token&client_id=" + client_id +
                    "&client_secret=" + client_secret + "&refresh_token=" + profile.refresh_token, {
                    method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
                }).then(response => response.json()).then(json => {
                    profile.access_token = json.access_token;
                    profile.id_token = json.id_token;
                    localStorage.profile = JSON.stringify(profile);
                });
            }
        });

    } catch (error) { }*/
}

function openTab(event, tabName) {
    // Declare all variables
    var i, tabcontent, navbuttons;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    navbuttons = document.getElementsByClassName("navbuttons");
    for (i = 0; i < navbuttons.length; i++) {
        navbuttons[i].className = navbuttons[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

async function submitCustomerInformation(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const value = data.get('firstname');
    console.log({ value });
    openTab(event, "manage");
    document.getElementById("resetButton").click();
}

function populateQuotationTable() {
    const table = document.getElementById("quotationTable");
    const request = new XMLHttpRequest();
    request.onload = function () {
        //const data = JSON.parse(this.responseText);
        //console.log(data.id);
    }
    years.forEach(function (year) {
        months.forEach(function (month) {
            request.open("GET", "data/" + year + "/" + month + ".json", true);
            if (request.status != 404)
                request.send();
        })
    })
}

function filterQuotations() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("quotationSearch");
    filter = input.value.toUpperCase();
    table = document.getElementById("quotationTable");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function sortQuotationTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("quotationTable");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            //check if the two rows should switch place:
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}