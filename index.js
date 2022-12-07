const endpoint = "https://oauth2.googleapis.com/token";
const drive_end = 'https://www.googleapis.com/drive/v3/files';
const sheets_end = 'https://sheets.googleapis.com/v4/spreadsheets';
const docs_end = 'https://docs.googleapis.com/v1/documents'
const client_id = '167979643861-c206l9c0vhor77mgveujailnleklgiad.apps.googleusercontent.com';
const client_secret = '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';
const scope = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive ' +
    'openid profile email';
const discovery_docs = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const redirect_uri = "localhost:8000"
const quotations_id = '1VkcwZo_-E10aDjmeRBr91V0htphc__eE';
let profile = {};
let currentSheet;
let tokenClient;
let timerID;
let timer;

function setupLogin() {
    if (window.location.href.split('?')[1] === undefined) {
        document.getElementById("loginButton").style.display = "flex";
        document.getElementById("googleImage").setAttribute("class", "spin");
    }

    const array = window.location.href.split('?')[1]?.split('&')[0]?.split('=');
    if (array != null && array[0] === "code" && array[1] !== null) {
        fetch(endpoint + "?grant_type=authorization_code&client_id=" +
            client_id + "&client_secret=" + client_secret + "&redirect_uri=http%3A//" +
            redirect_uri + "&code=" + array[1], {
            method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' },
        }).then(response => response.json()).then(json => {
            profile.access_token = json.access_token;
            profile.id_token = json.id_token;
            profile.refresh_token = json.refresh_token;
            profile.expires_in = json.expires_in * 1000;
            profile.save_time = new Date().getTime();
            fetch(endpoint + "info?id_token=" + json.id_token, {
                method: 'POST', headers: { 'Accept': 'application/x-www-form-urlencoded' }
            }).then(response => response.json()).then(json => {
                profile.email = json.email;
                profile.sub = json.sub;
                fetch(docs_end + '/1Qvc-kCvvJOfr60aF_OwVzi71QtEu6rNeLY-KubeaTHQ', makeRequest('GET')
                ).then(response => {
                    if (response.ok)
                        response.json().then(json => {
                            profile.apiKey = json.body.content[1].paragraph.elements[0].textRun.content;
                            localStorage.profile = JSON.stringify(profile);
                            setupDashboard();
                        });
                    else {
                        alert("This Account is not Allowed to login");
                        document.getElementById("loginButton").style.display = "flex";
                        document.getElementById("googleImage").setAttribute("class", "spin");
                    }
                });
            });
        });
    }
}

async function setupDashboard() {
    profile = JSON.parse(localStorage.profile);
    document.getElementById("login").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("dashboard").style.display = "block";
    if (await checkToken()) {
        createFile(new Date().getFullYear());
        createFile(new Date().toLocaleDateString('en-GB', { month: 'long' }));
        //updateSheet()
        //setupFiles();
    }
}

function login() {
    window.location = "https://accounts.google.com/o/oauth2/v2/auth?" +
        "response_type=code&include_granted_scopes=true&access_type=offline&" +
        "client_id=" + client_id + "&redirect_uri=http%3A//" + redirect_uri + "&" +
        "scope=https%3A%2F%2Fwww.googleapis.com/auth/drive%20openid%20profile%20email%20" +
        "https%3A%2F%2Fwww.googleapis.com/auth/spreadsheets&login_hint=rockshowholdings";
}

function logout() {
    localStorage.removeItem("profile");
    profile = {};
    document.getElementById("login").style.display = "flex";
    document.getElementById("content").style.display = "none";
    document.getElementById("loginButton").style.display = "flex";
    document.getElementById("googleImage").setAttribute("class", "spin");
}

async function checkToken() {
    let status;
    if (new Date().getTime() - profile.save_time >= profile.expires_in)
        status = await fetch(endpoint + '?grant_type=refresh_token&client_id=' + client_id +
            '&client_secret=' + client_secret + '&refresh_token=' + profile.refresh_token,
            makeRequest('POST')).then(response => response.json()).then(json => {
                profile.access_token = json.access_token;
                profile.id_token = json.id_token;
                profile.expires_in = json.expires_in * 1000;
                profile.save_time = new Date().getTime();
                localStorage.profile = JSON.stringify(profile);
                return true;
            });
    else status = true;
    if (timerID) clearTimeout(timerID);
    timerID = setTimeout(checkToken, profile.expires_in - new Date().getTime() + profile.save_time);
    return status;
}

async function createFile(name) {
    let parent = quotations_id;
    let type = 'application/vnd.google-apps.folder';
    if (name !== new Date().getFullYear()) {
        const request = await fetch(drive_end + '?q=%27' + quotations_id +
            '%27 in parents and name = %27' + new Date().getFullYear() +
            '%27', makeRequest('GET'));
        const list = await request.json();
        parent = list.files[0].id;
        type = 'application/vnd.google-apps.spreadsheet';
        if (!await fileExists('mimeType = %27' + type + '%27 and name = %27' + name + '%27',
            parent)) {
            const request = await fetch(drive_end, makeRequest('POST', {
                'name': name, 'mimeType': type, 'parents': [parent],
            }));
            const list = await request.json();
            updateSheet(list.id, {
                'updateSpreadsheetProperties': {
                    'properties': { 'title': name, },
                    'fields': 'title',
                }, 'addSheet': {
                    'properties': { 'title': 'Customers', },
                    'gridProperties': { 'columnCount': 6, 'frozenRowCount': 1, },
                    'fields': 'columnCount,frozenRowCount',
                },
            });
        }
    }
    if (!await fileExists('name = %27' + name + '%27', parent)) {
        fetch(drive_end, makeRequest('POST', {
            'name': name,
            'mimeType': type,
            'parents': [parent],
        })).then(response => {
            console.log(response);
        });
    }
}

async function fileExists(filter, parent) {
    const request = await fetch(drive_end + '?q=%27' + parent +
        '%27 in parents and' + filter, makeRequest('GET'));
    const list = await request.json();
    return list.files.length >= 1;
}

function listFiles() {
    fetch('https://www.googleapis.com/drive/v3/files?q=%27' + quotations_id +
        '%27 in parents and mimeType = %27application%2Fvnd.google-apps.spreadsheet%27',
        makeRequest('GET')
    ).then(response => response.json()).then(json => {
        console.log(json);
        json.files.forEach(function (file) {
            console.log(file.name + " " + file.id);
        });
    });
}

function updateSheet(id, request) {
    fetch(sheets_end + '/' + id,
        makeRequest('POST', {
            'requests': [request],
        })
    );
}

async function getFileID(filter, parent) {
    const request = await fetch(drive_end + '?q=%27' + parent +
        '%27 in parents and' + filter, makeRequest('GET'));
    const list = await request.json();
    return list.files[0].id;
}

function makeRequest(method, body) {
    return {
        method: method,
        headers: {
            'Accept': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + profile.access_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }
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