//const client_id = '154585617419-leljq0gg7ahs5ggcgd89ou80457siksn.apps.googleusercontent.com';
//const api_key = 'AIzaSyC3YgQLAAKnpUAvCCZokePbvZGRGiy06rs';
//const scopes = 'https://www.googleapis.com/auth/drive';
//const discovery_docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const years = ['2022'];
const id = "106525389156823461102";
var profile = localStorage.googleToken;
let tokenClient;
var execute;

function setupGoogleLogin() {
    execute = google.accounts.id.initialize({
        client_id: '167979643861-c206l9c0vhor77mgveujailnleklgiad.apps.googleusercontent.com',
        auto_select: false,
        callback: handleCredentialResponse,
        context: "signin",
        itp_support: true
    });
    google.accounts.id.renderButton(
        document.getElementById("googleLogin"),
        { shape: "pill" }
    );

    /*
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '167979643861-c206l9c0vhor77mgveujailnleklgiad.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive',
        callback: '',
    });*/

    if (profile !== 'null') {
        profile = JSON.parse(localStorage.googleToken);
        if (profile.email == "rockshowholdings@gmail.com") {
            document.getElementById("login").style.display = "none";
            document.getElementById("content").style.display = "block";
            document.getElementById("dashboard").style.display = "block";
            //google.accounts.id.prompt();
        }
    }
}

function setupGoogleDrive() {
    gapi.load('client', async function () {
        await gapi.client.init({
            apiKey: 'AIzaSyDtkyr1CEHyR_doXiwV2sUTwHT9Xv85RO8',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
    });
}

function login() {
    var url = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=';
    tokenClient.callback = async (response) => {
        const token = response.access_token;
        fetch(url + token, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        }).then(response => response.json()).then(json => {
            console.log(json.id === id);
            if (json.id === id) {
                profile = json;
                profile.token = token;
                localStorage.profile = JSON.stringify(profile);
                document.getElementById("login").style.display = "none";
                document.getElementById("content").style.display = "block";
                document.getElementById("dashboard").style.display = "block";
            } else {
                alert("Use the Rock Show Gmail Account!");
            }
        });

        if (response.error !== undefined) {
            throw (response);
        }
        //await listFiles();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

async function handleLogin(response) {
    console.log(response);
}

function handleCredentialResponse(response) {
    profile = decodeJwtResponse(response.credential);
    if (profile.email == "rockshowholdings@gmail.com") {
        localStorage.setItem("googleToken", JSON.stringify(profile));
        document.getElementById("login").style.display = "none";
        document.getElementById("content").style.display = "block";
        document.getElementById("dashboard").style.display = "block";
    } else {
        google.accounts.id.disableAutoSelect();
        alert("Use the correct Gmail Account!");
    }
}

function logout() {
    const token = gapi.client.getToken();
    profile = null;
    localStorage.profile = null;
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    document.getElementById("login").style.display = "flex";
    document.getElementById("content").style.display = "none";
}

function refreshPage(data) {

    console.log(data);
    //window.location.reload();
}

function decodeJwtResponse(token) {
    var data = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    var string = decodeURIComponent(window.atob(data).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(string);
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