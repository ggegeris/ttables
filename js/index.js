var importvis = false;

function toggleImport()
{
    importvis = !importvis;
    document.getElementById("importprompt").style.display = importvis ? "block" : "none";
    if(importvis)
    {
        document.getElementById("importfield").focus();
    }
    else
    {
        document.getElementById("searchfield").focus();
    }
}

function importSubmit()
{
    // to do
}

var paths = {stops: "stops.txt", 
            stop_times: "stop_times.txt",
            trips: "trips.txt",
            routes: "routes.txt"};
var stops, stop_times, trips, routes;
var responses = {};
var mainPath = "res";
var loadComplete = false;

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
        stops = preprocess(responses.stops),
        stop_times = preprocess(responses.stop_times),
        trips = preprocess(responses.trips),
        routes = preprocess(responses.routes);
        document.getElementById("info").innerHTML = "";
        document.getElementById("info").style.display = "none";
        document.getElementById("questionnaire").style.display = "block";
        document.getElementById("selection").style.display = "block"; // for now
        document.getElementById("searchfield").focus();
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

function searchFieldKeyDown(event)
{
    if(event.keyCode == 13)
    {
        searchStops(document.getElementById('searchfield').value);
    }
    else
    {
        document.getElementById("smsearch").disabled = false;
    }
}

function manualFieldKeyDown(event)
{
    if(event.keyCode == 13)
    {
        document.getElementById("smmanual").disabled = true;
        document.getElementById("manualid").innerHTML = "";
        document.getElementById("manualid").focus();
        addManually();
    }
    else
    {
        document.getElementById("smmanual").disabled = false;
    }
}

function searchStops(query)
{
    if(document.getElementById("smsearch").disabled == true)
    {
        return;
    }
    document.getElementById("smsearch").disabled = true;
    document.getElementById("results").style.display = "block";
    document.getElementById("results").innerHTML = "searching...";
    document.getElementById("manualinfo").innerHTML = "";
    query = query.trim();
    if(query.length < 3) 
    {
        document.getElementById("results").innerHTML = "enter at least 3 characters";
        return;
    }
    setTimeout(function() { // to flush visual changes
        var searchResults = [];
        stops.forEach(element => {
            // console.log(`${element["stop_name"].toLowerCase()} contains ${query.toLowerCase()} ?`);
            if(element.stop_name.toLowerCase().indexOf(query.toLowerCase()) > -1)
            {
                var tobepooschd = getInfoFromID(element.stop_id, element.stop_name, element.stop_lat, element.stop_lon); // pronounced: to-be-pushed
                // console.log(tobepooschd)
                searchResults.push(tobepooschd);
            }
            
            if(searchResults.length > 50)
            {
                document.getElementById("results").innerHTML = "enter a specific search term (too many results)";
                throw "toomanyresults";
            }
        });
        console.log(`${searchResults.length} results found`);
        // console.debug(searchResults); // commented for performance
        document.getElementById("results").innerHTML = "<tr><td class=resultstable rowspan=10 style=\"border: none;\">results: (<a href=\"javascript:;\" id=expcolresults1 onclick=\"expcolresults();\">collapse</a>)</td></tr><table id=resultstable></table>"
        for(var i in searchResults)
        {
            var stopName = searchResults[i].stopName;
            var stopID = searchResults[i].stopID;
            var stop_lat = searchResults[i].stop_lat;
            var stop_lon = searchResults[i].stop_lon;
            document.getElementById("resultstable").innerHTML += `
<tr class=resultstable>
    <td colspan=5 class="resultstable norightborder">
        ${stopName} (<a href=\"javascript:;\" class=rightalign onclick="window.open(gmurl(${stop_lat},${stop_lon}))">Show in map</a> / <a class=rightalign href="javascript:addStop(&quot;${stopID}&quot;);">Select</a>) 
    </td>
</tr>`;
            for(var j in searchResults[i].members)
            {
                document.getElementById("resultstable").innerHTML += 
`<tr class="resultstable notopborder nobottomborder norightborder">
    <td class=widener></td>
    <td>
        <span class="material-icons-outlined md-18">
            navigate_next
        </span>
    </td>
    <td class="resultstable notopborder nobottomborder norightborder noleftborder">
        <div class=shortname style="background-color:#${searchResults[i].members[j].route_colour}; color:#${searchResults[i].members[j].route_text_colour};">
            ${searchResults[i].members[j].route_short_name.substring(1, searchResults[i].members[j].route_short_name.length - 1)}
        </div>
    </td>
    <td class="resultstable notopborder nobottomborder noleftborder">
        ${searchResults[i].members[j].trip_headsign}
    </td>
</tr>`;
            }
        }
        document.getElementById("resultstable").innerHTML += "<tr class=\"resultstable noleftborder norightborder nobottomborder\"><td class=resultstable rowspan=10 style=\"border: none;\"><a href=\"javascript:;\" id=expcolresults2 onclick=\"expcolresults();\">collapse</a></td></tr>";
        expcolresults();
    }, 100);
}

function getInfoFromID(stopID, stopName, lat, lon)
{
    var stoptimedata = stop_times.filter(stop_time => {
        return stop_time["stop_id"] == stopID;
    });
    var output = {
        stopName: stopName.substring(1, stopName.length - 1).replaceAll('""', '"'),
        stopID: stopID,
        stop_lat: lat,
        stop_lon: lon,
        members: {}
    }
    stoptimedata.forEach(element => {
        var trip_id = element.trip_id;
        var tripdata = trips.find(trip => {
            return trip["trip_id"] == trip_id;
        });
        // console.log(tripdata);
        var route_id = tripdata.route_id;
        var trip_headsign = tripdata.trip_headsign.substring(1, tripdata.trip_headsign.length - 1).replaceAll('""', '"'),
        shape_id = tripdata.shape_id;
        var routedata = routes.find(route => {
            return route.route_id == route_id;
        });
        var route_short_name = routedata.route_short_name,
        route_colour = routedata.route_color,
        route_text_colour = routedata.route_text_color;
        shape_id = shape_id.split('_')[0] + '_'
                 + shape_id.split('_')[1] + '_'
                 + shape_id.split('_')[2] + '_?-'
                 + shape_id.split('-')[shape_id.split('-').length - 1];
        output.members[shape_id] = {
            trip_headsign: trip_headsign,
            route_short_name: route_short_name,
            route_colour: route_colour,
            route_text_colour: route_text_colour
        };
    });
    output.members = sortObject(output.members);
    /* output.members.sort((a, b) => {
        return parseInt(a.route_short_name.substring(1, a.route_short_name.length - 1)) - parseInt(b.route_short_name.substring(1, b.route_short_name.length - 1));
    }); */
    return output;
}

function expcolresults()
{
    if(document.getElementById("expcolresults1").innerHTML == "expand")
    {
        document.getElementById("expcolresults1").innerHTML = "collapse";
        document.getElementById("resultstable").style.display = "block";
    }
    else
    {
        document.getElementById("expcolresults1").innerHTML = "expand";
        document.getElementById("resultstable").style.display = "none";
    }
}


function sortObject(obj)
{
    var sortable = [];
    for(var route in obj) {
        sortable.push([route, obj[route]]);
    }
    sortable.sort(function(a, b) {
        if(parseInt(a[1].route_short_name.substring(1, a[1].route_short_name - 1)) == parseInt(b[1].route_short_name.substring(1, b[1].route_short_name - 1)))
        {
            return a[1].trip_headsign < a[1].trip_headsign;
        }
        return a[1][0] - b[1][0];
    });
    var objSorted = {};
    sortable.forEach(function(item) {
        objSorted[item[0]] = item[1];
    });
    return objSorted;
}

var options = {stops: [], preferences:{}};

function addStop(stopID)
{
    var stopdata = stops.find(stop => {
        return stop["stop_id"] == stopID;
    });
    if(stopdata === undefined) 
    {
        document.getElementById("manualinfo").innerHTML = "Invalid stopID";
        console.error(`stop ${stopID} not found`);
        throw "stopIDnotfound";
    }
    else
    {
        document.getElementById("manualinfo").innerHTML = "";
    }
    var stopName = stopdata["stop_name"].substring(1, stopdata["stop_name"].length - 1);
    
    for(var i in options.stops)
    {
        // console.log(`${options.stops[i].stopID} v.s. ${stopID}`)
        if(options.stops[i].stopID == stopID)
        {
            return;
        }
    }
    // console.log(`added ${stopID}`)
    /* if(options.stops.includes({stopID: stopID, stopName: stopName}))
    {
        return;
    } */
    options.stops.push({
        stopID: stopID,
        stopName: stopName.replaceAll('""', '"')
    });
    console.log(`stop ${stopID} added`);
    updateSelectionDisplay();
}

function addManually()
{
    var stopID = document.getElementById("manualid").value;
    document.getElementById("manualid").value = "";
    document.getElementById("manualid").focus();
    stopIDnumber = "", stopIDletter = "";
    for(var i = 0; i < stopID.length; i++)
    {
        if(stopID[i] >= '0' && stopID[i] <= '9')
        {
            stopIDnumber += stopID[i];
        }
        else
        {
            stopIDletter += stopID[i];
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
        console.debug(`prepended ${app}x'0' to stopID`)
    }
    stopID = stopIDnumber + stopIDletter;

    addStop(stopID);
}

function clearStop(stopIDtodelete)
{
    // console.log(options);
    options.stops = options.stops.filter(e => e.stopID != stopIDtodelete);
    console.log(`removed ${stopIDtodelete}`);
    // console.log(options);
    updateSelectionDisplay();
}

function clearPref(prefID)
{
    document.getElementById(prefID).checked = false;
    updateFields();
    updateSelectionDisplay();
}

function updateSelectionDisplay()
{
    updateNameIDlist();
    document.getElementById("optionstable").innerHTML = `<tr>
    <td colspan=3 class=optionstitle>
        stops:
    </td>
</tr>`;
    for(var stop in options.stops)
    {
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearStop(&quot;${options.stops[stop].stopID}&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            ${options.stops[stop].stopID}
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.stops[stop].stopName}
        </td>
    </tr>`
    }
    document.getElementById("optionstable").innerHTML += `<tr>
    <td colspan=3 class=optionstitle>
        preferences:
    </td>
</tr>`;

    options.preferences = {};
    if(document.getElementById("scrollspeedcheck").checked)
    {
        options.preferences["scrollSpeed"] = document.getElementById("scrollspeedinput").value;
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearPref(&quot;scrollspeedcheck&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            scrollSpeed
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.preferences["scrollSpeed"]}
        </td>
    </tr>`;
    }
    if(document.getElementById("absolutespeedcheck").checked)
    {
        options.preferences["absoluteSpeed"] = document.getElementById("absolutespeed").checked;
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearPref(&quot;absolutespeedcheck&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            absoluteSpeed
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.preferences["absoluteSpeed"]}
        </td>
    </tr>`;
    }
    if(document.getElementById("timecollapsedcheck").checked)
    {
        options.preferences["timeCollapsed"] = document.getElementById("timecollapsedinput").value;
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearPref(&quot;timecollapsedcheck&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            timeCollapsed
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.preferences["timeCollapsed"]}
        </td>
    </tr>`;
    }
    if(document.getElementById("timediscardedcheck").checked)
    {
        options.preferences["timeDiscarded"] = document.getElementById("timediscardedinput").value;
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearPref(&quot;timediscardedcheck&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            timeDiscarded
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.preferences["timeDiscarded"]}
        </td>
    </tr>`;
    }
    if(document.getElementById("nameidcheck").checked)
    {
        options.preferences["nameID"] = document.getElementById("nameidselect").value;
        document.getElementById("optionstable").innerHTML += `<tr class="option noleftborder norightborder">
        <td class="optiontext noleftborder norightborder">
            <button class=crossbutton onclick="clearPref(&quot;nameidcheck&quot;);">
                <span class="material-icons-outlined md-18">
                    clear
                </span>
            </button>
            
        </td>
        <td class="optiontext noleftborder norightborder">
            nameID
        </td>
        <td class="optionsubtext noleftborder norightborder">
            ${options.preferences["nameID"]}
        </td>
    </tr>`;
    }
    document.getElementById("optionstable").innerHTML += `<tr>
    <td colspan=3 class=optionstitle> 
        <a id=copylink href="javascript:copyLink()">copy link</a>
    </td>
</tr>`
}

function updateFields(radio = 0) 
{
    console.debug("updating fields");

    if(document.getElementById("absolutespeedcheck").checked)
    {
        document.getElementById("dynamicspeed").disabled = false;
        document.getElementById("absolutespeed").disabled = false;
        if(radio == 1)
        {
            document.getElementById("dynamicspeed").checked = true;
            document.getElementById("absolutespeed").checked = false;
        }
        else if(radio == 2)
        {
            document.getElementById("dynamicspeed").checked = false;
            document.getElementById("absolutespeed").checked = true;
        }
    }
    else
    {
        document.getElementById("dynamicspeed").disabled = true;
        document.getElementById("absolutespeed").disabled = true;
        document.getElementById("dynamicspeed").checked = true;
        document.getElementById("absolutespeed").checked = false;
    }

    if(document.getElementById("scrollspeedcheck").checked)
    {
        document.getElementById("scrollspeedinput").disabled = false;
    }
    else
    {
        document.getElementById("scrollspeedinput").disabled = true;
        document.getElementById("scrollspeedinput").value = document.getElementById("dynamicspeed").checked ? 2 : 8;
    }

    if(document.getElementById("timecollapsedcheck").checked)
    {
        document.getElementById("timecollapsedinput").disabled = false;
    }
    else
    {
        document.getElementById("timecollapsedinput").disabled = true;
        document.getElementById("timecollapsedinput").value = 60;
    }

    if(document.getElementById("timediscardedcheck").checked)
    {
        document.getElementById("timediscardedinput").disabled = false;
    }
    else
    {
        document.getElementById("timediscardedinput").disabled = true;
        document.getElementById("timediscardedinput").value = 60;
    }

    updateNameIDlist();
    if(document.getElementById("nameidcheck").checked)
    {
        document.getElementById("nameidselect").disabled = false;
    }
    else
    {
        document.getElementById("nameidselect").disabled = true;
    }
}

function updateNameIDlist() 
{
    var nameList = [], nameSel = document.getElementById("nameidselect").value;
    for(var i in options.stops)
    {
        // console.log(`${options.stops[i].stopID} v.s. ${stopID}`)
        if(!nameList.includes(options.stops[i].stopName))
        {
            nameList.push(options.stops[i].stopName);
        }
    }
    document.getElementById("nameidselect").innerHTML = "";
    for(var i in nameList)
    {
        document.getElementById("nameidselect").innerHTML += `<option value="${i}"${i == nameSel ? " selected" : ""}>${nameList[i]}</option>`
    }
}

function copyLink()
{
    var destination = window.location.href.split("/?")[0].split("?")[0].split("/#")[0].split("#")[0];
    if(destination[destination.length - 1] != '/')
    {
        destination += '/';
    }
    destination += "display.html";
    var params = new URLSearchParams();
    for(var i in options.stops)
    {
        params.append("stopID", options.stops[i].stopID);
    }
    for(var i in options.preferences)
    {
        params.append(i, options.preferences[i]);
    }
    navigator.clipboard.writeText(destination + "?" + params.toString());
    document.getElementById("copylink").innerHTML = "copied!";
}

function gmurl(lat, lon)
{
    return `http://maps.google.com/maps?q=${lat},${lon}`;
}

function replaceAll(string, search, replace) 
{
    return string.split(search).join(replace);
}