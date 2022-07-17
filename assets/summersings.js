window.addEventListener('load', function () {
  // Display past events differently, as dictated by the CSS entry for
  // 'past-event'.  The function can be attached to a DOM node, in which case
  // only subnodes of that will be examined, or not, in which case the entire
  // document will be searched.
  //
  // displayPastEvents assumes that every dated event (those with
  // class='dated-event') contains a "data-event-date" attribute, which gives
  // the date (and optionally the time) of the event in ISO format. The time, if
  // present, is ignored.  If there is no 'data-event-date' attribute, nothing
  // happens.
  function displayPastEvents(table) {

    // Get all the dated events
    const datedEvents = table.getElementsByClassName('dated-event')

    // Within each dated event, get the 'data-event-date' attribute value and
    // compare it to the current date.
    const now = new Date()			// Current date/time

    for (let i = 0; i < datedEvents.length; ++i) {
      let eventDateTime = datedEvents[i].getAttribute('data-event-date')
      if (eventDateTime) {		// Make sure there is one
        if (eventDateTime.length === 10)
          eventDateTime += 'T23:59:59'
        const eventDate = new Date(eventDateTime)
        if (now > eventDate) {
          datedEvents[i].classList.add('past-event')
        }
      }
    }
  }

  const table = document.getElementById('summer-sing-table')
  if (table) displayPastEvents(table)
})