// placeholders (not pornhub!)
/* phStopName = "Nacionālā blibliotēka",
    phRouteColour = "#FF000C",
    phTextColour = "#FFFFFF",
    phShortName = "1",
    phHeadsign = "Jugla",
    phTime1 = 3,
    phTime2 = 69, */
    // phStopID = 3008; // 3008, 1230, 3055, 5186
console.warn("In case of emergency, pull `stop()`");

var urlParams = new URLSearchParams(window.location.search);
var stopIDs = urlParams.getAll("stopID");
// stopIDs = stopIDs[0]; // for now
if(!urlParams.has('stopID'))
{
    stopIDs = prompt("stopID not specified. please specify stopIDs (separated by ,) or click 'Cancel' and get a new link at index.html").split(",");
}
if(stopIDs === null || stopIDs.length <= 0)
{
    console.error("no stop ID specified");
    infoMessage("no stop ID specified")
    throw "nostopID";
}
var scrollSpeed;
if(urlParams.has('scrollSpeed'))
{
    scrollSpeed = urlParams.get("scrollSpeed");
}
else
{
    scrollSpeed = 2;
}
var absoluteSpeed;
if(urlParams.has('absoluteSpeed'))
{
    absoluteSpeed = urlParams.get("absoluteSpeed");
    if(!urlParams.has('scrollSpeed'))
    {
        scrollSpeed = 8;
    }
}
else
{
    absoluteSpeed = false;
}
var timeCollapsed;
if(urlParams.has('timeCollapsed'))
{
    timeCollapsed = urlParams.get("timeCollapsed");
}
else
{
    timeCollapsed = 60;
}
var timeDiscarded;
if(urlParams.has('timeDiscarded'))
{
    timeDiscarded = urlParams.get("timeDiscarded");
}
else
{
    timeDiscarded = 60;
}
var nameID;
if(urlParams.has('nameID'))
{
    nameID = urlParams.get("nameID");
}
else
{
    nameID = -1;
}

document.getElementById("info").innerHTML = "Loading...";
var waitTime = -1, timer = 0;
function setKLOK()
{
    document.getElementById("klok").innerHTML = nows();
    // console.log(timer);
    if(waitTime == -1) return;
    if(timer == waitTime)
    {
        if(document.getElementById(`arrowdown`).style.display == "none")
        {
            console.debug("scrolling up");
            scroll = 0;
        }
        else
        {
            console.debug("scrolling down");
            onArrowDown();
        }
        timer = 0;
    }
    timer++;
}
var setKLOKInterval = setInterval(setKLOK, 100);

var mainPath = "res"; // the '/' is gonna get added l8r
var paths = {stops: "stops.txt", 
            stop_times: "stop_times.txt",
            trips: "trips.txt",
            routes: "routes.txt",
            calendar: "calendar.txt",
            calendar_dates: "calendar_dates.txt"};
var responses = {};
var data = {};
var time = now();
var loadComplete = false;
var updateInterval;
var stopName;
var timetableWD = {}, timetableWE = {};

// setting placeholders (not pornhub!!)
/* document.getElementById("pv").innerHTML = phStopName;
document.getElementById("r1").style.backgroundColor = phRouteColour;
document.getElementById("r1").style.color = phTextColour;
document.getElementById("r1").innerHTML = phShortName;
document.getElementById("hc1").innerHTML = phHeadsign;
document.getElementById("tc1").innerHTML = `${phTime1} min; ${phTime2} min`; */

function request(path, name)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    console.debug(`Getting ${path}`);
    xhr.onload = () => 
    { 
        console.debug(`Obtained ${path}`);
        responses[name] = xhr.response;
    }
    xhr.send();
}

function today()
{
    const d = new Date();
    return parseInt("" + d.getFullYear() + (d.getMonth() < 10 ? `0${d.getMonth()}` : d.getMonth()) + (d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()));
}

function now()
{
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
}

function nows()
{
    const d = new Date();
    return `${d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()}:${d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()}:${d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()}`;
}

function weekday(tomorrow) {
    const d = new Date();
    let day = d.getDay();
    if(tomorrow) day = (day + 1) % 7;
    return 0 < day && day < 6;
}

function getTime(string)
{
    var h = parseInt(string.split(':')[0]),
    m = parseInt(string.split(':')[1]),
    s = parseInt(string.split(':')[2]);
    return 60 * h + m;
}

for(var path in paths)
{
    request(`${mainPath}/${paths[path]}`, path);
}

function wait()
{
    if(Object.keys(paths).length == Object.keys(responses).length && !loadComplete)
    {
        loadComplete = true;
        console.log("All resources loaded");
        clearInterval(waitInterval);
        try 
        {
            for(stop in stopIDs) 
            {
                console.log(`processing stop ${stopIDs[stop]}`);
                process(stopIDs[stop]);
            }
            if(stopNames.length > 1)
            {
                while(0 > nameID || nameID >= stopNames.length)
                {
                    var pr = "multiple stop names detected. please select ID of stop name you want to display: "
                    for(i in stopNames)
                    {
                        pr += "\n" + i + " - " + stopNames[i];
                    }
                    nameID = parseInt(prompt(pr, 0));
                }
                document.getElementById("pv").innerHTML = stopNames[nameID];
                document.getElementById("paget").innerHTML = `${stopNames[nameID]} - Transport tables`;
            }
            else
            {
                document.getElementById("pv").innerHTML = stopNames[0];
                document.getElementById("paget").innerHTML = `${stopNames[0]} - Transport tables`;
            }
            document.getElementById("info").innerHTML = "";
            updateInterval = setInterval(update, 250);
        }
        catch(err)
        {
            console.error(`couldn't prepare the timetable (${err})`);
        }
    }
}
var waitInterval = setInterval(wait, 50);

function preprocess(string)
{
    var headers = string.split('\n')[0].split(','), output = [];
    var list = string.split('\n');
    list.splice(0, 1);
    for(var i = 0; i < list.length; i++)
    {
        var items = list[i].split(',');
        var add = {};
        for(var j = 0; j < headers.length; j++)
        {
            add[headers[j]] = items[j];
        }
        output.push(add);
    }
    return output;
}

var stopNames = [];

function process(stopID)
{
    stopIDnumber = "", stopIDletter = "";
    for(var i = 0; i < stopID.length; i++)
    {
        if(stopID[i] >= '0' && stopID[i] <= '9')
        {
            stopIDnumber += stopID[i];
        }
        else
        {
            stopIDletter += stopID[i]
        }
    }
    var app = 0;
    while(stopIDnumber.length < 4)
    {
        stopIDnumber = "0" + stopIDnumber;
        app++;
    }
    if(stopID != stopIDnumber + stopIDletter)
    {
        console.log(`prepended ${app}x'0' to stopID`)
    }
    stopID = stopIDnumber + stopIDletter;
    // console.log(preprocess(responses["stops"]));
    for(var response in responses)
    {
        data[response] = preprocess(responses[response]);
    }
    // console.log(data);

    // looking for stop_name
    var stopdata = data["stops"].find(stop => {
        return stop["stop_id"] == stopID;
    });
    // console.log(stopdata);
    if(stopdata === undefined) 
    {
        document.getElementById("info").innerHTML = "Invalid stopID";
        console.error(`stop ${stopID} not found`);
        throw "stopIDnotfound";
    }
    var stopName = stopdata["stop_name"].substring(1, stopdata["stop_name"].length - 1).replaceAll('""', '"');
    if(!stopNames.includes(stopName))
    {
        stopNames.push(stopName);
        /* console.log(`stop name ${stopName} not in list yet`)
    }
    else
    {
        console.log(`stop name ${stopName} is in list already`) */
    }
    // document.getElementById("pv").innerHTML = stopName;
    // document.getElementById("paget").innerHTML = stopName;

    // looking for departure_times and trip_ids
    var stoptimedata = data["stop_times"].filter(stop_time => {
        return stop_time["stop_id"] == stopID;
    });
    // console.log(stoptimedata);
    if(stoptimedata.length < 1) 
    {
        console.error(`no departures from ${stopID}`);
        throw "nodepartures";
    }
    else console.log(`found ${stoptimedata.length} suitable departures from ${stopID}`)
    // for each departure get route_id, trip_headsign and service_id
    var invalidC = 0;
    for(departure in stoptimedata)
    {
        var tripdata = data["trips"].find(trip => {
            return trip["trip_id"] == stoptimedata[departure]["trip_id"];
        });
        var service_id = tripdata["service_id"];
        // if(stoptimedata[departure]["trip_id"] == 6500) console.log(tripdata);

        // check validity
        var caldata = data["calendar"].find(service => {
            return service["service_id"] == service_id;
        });
        // if(stoptimedata[departure]["trip_id"] == 6500) console.log(`${caldata["start_date"]} ${caldata["end_date"]}`);
        if(parseInt(caldata["start_date"]) > today() || today() > parseInt(caldata["end_date"]))
        {
            // console.log("service is not valid");
            invalidC++;
            continue;
        }

        var headsign = tripdata["trip_headsign"].substring(1, tripdata["trip_headsign"].length - 1).replaceAll('""', '"'),
        routeid = tripdata["route_id"],
        shapeid = tripdata["shape_id"],
        dirid = tripdata["direction_id"];

        // gather some more data
        var routedata = data["routes"].find(route => {
            return route["route_id"] == routeid;
        });
        var shortname = routedata["route_short_name"],
        colour = routedata["route_color"],
        textcolour = routedata["route_text_color"];

        // shape_id-s might have matching destinations but different start points
        shapeid = shapeid.split('_')[0] + '_' + shapeid.split('_')[1] + '_' + shapeid.split('_')[2] + '_' + shapeid.split('-')[shapeid.split('-').length - 1];

        // check days and push
        if(caldata["monday"] == "1" && caldata["tuesday"] == "1" && caldata["wednesday"] == "1" && caldata["thursday"] == "1" && caldata["friday"] == "1")
        {
            if(timetableWD[shapeid] === undefined)
            {
                timetableWD[shapeid] = {
                    shortname: shortname,
                    colour: colour,
                    textcolour: textcolour,
                    headsign: headsign,
                    dirid: dirid,
                    departures: [],
                    two: []
                };
            }
            timetableWD[shapeid].departures.push(getTime(stoptimedata[departure]["departure_time"]));
            timetableWD[shapeid].departures.sort(function(a, b){return a-b});
        }
        if(caldata["saturday"] == "1" && caldata["sunday"] == "1")
        {
            if(timetableWE[shapeid] === undefined)
            {
                timetableWE[shapeid] = {
                    shortname: shortname,
                    colour: colour,
                    textcolour: textcolour,
                    headsign: headsign,
                    dirid: dirid,
                    departures: [],
                    two: []
                };
            }
            timetableWE[shapeid].departures.push(getTime(stoptimedata[departure]["departure_time"]));
            timetableWE[shapeid].departures.sort(function(a, b) {return a - b});
        }
    }
    console.log(`${stoptimedata.length - invalidC} out of ${stoptimedata.length} departures at ${stopID} are valid and rendered`);
    // console.log("full timetables (weekday, then weekend): ")
    // console.log(timetableWD);
    // console.log(timetableWE);
}

var next = {}, scroll = 0, timetable2D, timetable2M;

function update()
{
    console.debug("doin da komputering");

    time = now();
    timetable2D = weekday(false) ? timetableWD : timetableWE;
    timetable2M = weekday(true) ? timetableWD : timetableWE;

    for(route in timetable2D)
    {
        if(next[route] == undefined || next[route][0] < now())
        {
            console.log(`updating ${route}`);
            next[route] = [];
            var nextIndex = timetable2D[route].departures.findIndex(checkTime);
            if(nextIndex < 0)
            {
                try
                {
                    next[route][0] = timetable2M[route].departures[0] + 1440;
                    try
                    {
                        next[route][1] = timetable2M[route].departures[1] + 1440;
                    }
                    catch {}
                }
                catch {}
            }
            else
            {
                if(nextIndex + 1 == timetable2D[route].departures.length)
                {
                    next[route][0] = timetable2D[route].departures[nextIndex];
                    try
                    {
                        next[route][1] = timetable2M[route].departures[0] + 1440;
                    }
                    catch {}
                }
                else
                {
                    next[route][0] = timetable2D[route].departures[nextIndex];
                    next[route][1] = timetable2D[route].departures[nextIndex + 1];
                }
            }
        }
        // console.log(next[route]);
    }

    next = sortNext(next, timetable2D);
    var onDisplay = 0;
    // console.log(next);
    for(var i = scroll; i < scroll + 4; i++)
    {
        try
        {
            var nextdata = timetable2D[Object.keys(next)[i]];
            document.getElementById(`r${i % 4 + 1}`).style.backgroundColor = `#${nextdata.colour}`;
            document.getElementById(`r${i % 4 + 1}`).style.color = `#${nextdata.textcolour}`;
            document.getElementById(`r${i % 4 + 1}`).innerHTML = nextdata.shortname.substring(1, nextdata.shortname.length - 1);
            document.getElementById(`hc${i % 4 + 1}`).innerHTML = nextdata.headsign;
            document.getElementById(`tc${i % 4 + 1}`).innerHTML = `${nextTime(next[Object.keys(next)[i]][0] - now(), next[Object.keys(next)[i]][1] - now())}`;
            onDisplay++;
        }
        catch 
        {
            // console.log(`couldn't display at row ${i % 4 + 1}`);
            document.getElementById(`r${i % 4 + 1}`).style.backgroundColor = "#aaaaaa";
            document.getElementById(`r${i % 4 + 1}`).style.color = "#333333";
            document.getElementById(`r${i % 4 + 1}`).innerHTML = "";
            document.getElementById(`hc${i % 4 + 1}`).innerHTML = "";
            document.getElementById(`tc${i % 4 + 1}`).innerHTML = "";
        }
    }
    waitTime = (absoluteSpeed == "true" || absoluteSpeed == 1 ? 1 : onDisplay) * scrollSpeed * 10;
    // console.debug(waitTime / 10);
    try
    {
        nextTime(next[Object.keys(next)[scroll + 4]][0] - now(), next[Object.keys(next)[scroll + 4]][1] - now());
        document.getElementById(`arrowdown`).style.display = "";
    }
    catch
    {
        document.getElementById(`arrowdown`).style.display = "none";
    }
    if(scroll == 0)
    {
        document.getElementById(`arrowup`).style.display = "none";
    }
    else
    {
        document.getElementById(`arrowup`).style.display = "";
    }
    document.getElementById("klok").innerHTML = nows();

    // console.debug(scroll);
    // stop(); // for testing only
}

function checkTime(value)
{
    return value >= time;
}

function nextTime(time1, time2)
{
    var out = "";
    if(time1 == time2)
    {
        throw "duplicatetimes";
    }

    if(time1 == 0)
    {
        out += "<i><1 min</i>";
    }
    else if(time1 - 1 < timeCollapsed /* || true */)
    {
        out += `${time1} min`;
    }
    else if(time1 - 1 < timeDiscarded)
    {
        time1 += now();
        out += `${parseInt(time1 / 60) % 24 < 10 ? `0${parseInt(time1 / 60) % 24}` : parseInt(time1 / 60) % 24}:${time1 % 60 < 10 ? `0${time1 % 60}` : time1 % 60}`;
    }
    else
    {
        throw "waittimetoolong";
    }
    
    if(time2 - 1 < timeCollapsed /* || true */)
    {
        out += `; ${time2} min`;
    }
    else if(time2 - 1 < timeDiscarded)
    {
        time2 += now();
        out += `; ${parseInt(time2 / 60) % 24 < 10 ? `0${parseInt(time2 / 60) % 24}` : parseInt(time2 / 60) % 24}:${time2 % 60 < 10 ? `0${time2 % 60}` : time2 % 60}`;
    }
    return out;
    // time1 += now();
    // return `${parseInt(time / 60) % 24 < 10 ? `0${parseInt(time / 60) % 24}` : parseInt(time / 60) % 24}:${time % 60 < 10 ? `0${time % 60}` : time % 60}`;
}

function sortNext(obj)
{
    var sortable = [];
    for(var route in obj) {
        sortable.push([route, obj[route]]);
    }
    sortable.sort(function(a, b) {
        if(a[1][0] == b[1][0])
        {
            var an, bn;
            try
            {
                an = timetableWD[a[0]].shortname.substring(1, timetableWD[a[0]].shortname.length - 1);
            }
            catch
            {
                an = timetableWE[a[0]].shortname.substring(1, timetableWE[a[0]].shortname.length - 1);
            }
            try
            {
                bn = timetableWD[b[0]].shortname.substring(1, timetableWD[b[0]].shortname.length - 1);
            }
            catch
            {
                bn = timetableWE[b[0]].shortname.substring(1, timetableWE[b[0]].shortname.length - 1);
            }
            if(an == bn)
            {
                try
                {
                    an = timetableWD[a[0]].headsign;
                }
                catch
                {
                    an = timetableWE[a[0]].headsign;
                }
                try
                {
                    an = timetableWD[a[0]].headsign;
                }
                catch
                {
                    an = timetableWE[a[0]].headsign;
                }
                console.log(`.headsign: ${an} v.s. ${bn}`);
                return an < bn ? -1 : 1;
            }
            return parseInt(an) - parseInt(bn);
        }
        return a[1][0] - b[1][0];
    });
    var objSorted = {}
    sortable.forEach(function(item){
        objSorted[item[0]]=item[1]
    });
    return objSorted;
}

function stop()
{
    clearInterval(updateInterval);
}

function onArrowUp()
{
    scroll -= 4;
    timer = 0;
}
function onArrowDown()
{
    scroll += 4;
    timer = 0;
}

function infoMessage(msg)
{
    document.getElementById("info").innerHTML = msg;
}

function replaceAll(string, search, replace) 
{
    return string.split(search).join(replace);
}

// Object.keys(objectName)[0] // to get first key