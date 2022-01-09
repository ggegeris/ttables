# ttables

a cool display of incoming public transport in bus stops in the city of *Riga*.

## how to use

go to ***[ggegeris.github.io/ttables](ggegeris.github.io/ttables)*** to set up a timetable

* on the left side you add bus stops and add preferences (if needed)
* on the right side you can see what's been added, remove stops and generate/open the timetable

1. type a search term in the search box and press enter or the search button
2. the results will look something like this: 

    ![a piece of search results](https://ggegeris.github.io/ttables/img/help-results.jpg)

    this is what the buttons do:
    * collapse/expand - well, try clicking it 
    * show on map - open bus stop location in google maps (as approximate as rīgas satiksme wants it to be)
    * ***select - add to timetable***
    

    > note: the list of bus routes is there for reference, dangling with it is a waste of time

3. click *select* to add the stop to the display. 

    you can add multiple stops with multiple names (if you choose to do so, be sure to specify the stop name in preferences as only one can be displayed)

4. to add any preferences, tick the according boxes and enter a value (if needed)

    > preference documentation below (see preferences section)

5. to launch the timetable, click *open in new tab* on the right side of the page

> if you don't select any stops, you'll be asked to enter `stopID`s every time

> note: the timetable link is generated on the fly and is not saved anywhere. copy the link and save it somewhere or bookmark the display page to be able to access it later

## preferences

when making this thing, i couldn't decide on how the preferences should be set up. i decided to leave it to the user. here's how to make a timetable **your** timetable:

* custom scroll speed (`scrollSpeed` seconds)

    this is how long it takes to show the currently displayed routes. to see how the value affects the display, see the next preference. default is 2 (dynamic) or 8 (absolute) seconds

* custom timing approach (dynamic/absolute)
    
    there's two ways how you can control the timetable scrolling when there's more than 4 routes displayed.

    * *dynamic mode* (default) multiplies the scroll speed by the number of routes currently visible (so if there's 3 routes on screen, the routes will change after `scrollSpeed * 3` seconds)
    * *absolute mode* will always scroll after `scrollSpeed` seconds (this mode is used by rīgas satiksme on their displays, and it's driving me nuts)

    the value is saved as a boolean `absoluteSpeed` which is `true` if you choose absolute mode, `false` if you choose dynamic mode.

    > **note:** by changing the approach, the time it takes to show one page can change by up to 4 times, so be sure to check scroll speed after changing the approach

* custom collapse time (`timeCollapsed` minutes)

    if the scheduled departure is more than `timeCollapsed` minutes away, the route will be shown as, for example, `10:00` instead of `30 min`. default is 60 minutes

    > note: the default `timeCollapsed` is equal to the default `timeDiscarded` (see below), therefore you can't see the `10:00` format without modifying the preferences

* custom visible time (`timeDiscarded` minutes)

    the display will only consider departures that within `timeDiscarded` minutes of the current time. default is 60 minutes

* stop name ID (`nameID`-th position in stop list)

    the display can only show one stop name at a time. in case you've selected stops with different names, you'll need to specify which one you want to show up.

    if you're using the setup page, select the stop name from the dropdown menu. in case you happen to be editing the url, enter the index of the `stopID` from the list.

    > the index refers to the position of the stop name in the list of selected stop names. keep in mind that **the first stop name is at position 0**.

    this parameter does not have a default value. if you don't specify it in setup, you'll be asked upon launching the display every time.

## data

data used in timetables is provided by rīgas satiksme and available at [data.gov.lv](https://data.gov.lv/dati/lv/dataset/marsrutu-saraksti-rigas-satiksme-sabiedriskajam-transportam)

the data is updated by rīgas satiksme once a month. on top of that, the data must be manually submitted to the repo by me (and that can take a while).