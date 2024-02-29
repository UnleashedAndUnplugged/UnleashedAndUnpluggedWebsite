// retrieve image extension and set image source
fetch("/api/general-page/extensions")
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      let extension = data.data.shows;
      $("#page-image").attr("src", "/public/images/shows/shows." + extension);
    }
  });

// generate concert entry
function generateConcertEntry(data, num) {
  let concertEntry = $("<div class='concert-entry'></div>");
  concertEntry.html($("#concert-entry-template").html());

  concertEntry.find(".concert-entry-name").text(data.name);
  concertEntry.find(".concert-entry-date").html(data.date);
  concertEntry.find(".concert-entry-time").html(data.time);
  concertEntry.find(".concert-entry-img").attr("src", "/public/images/shows/" + data.img);
  concertEntry.find(".concert-entry-description").text(data.description);

  if (num % 2 === 1) {
    concertEntry.find("div").css("flex-direction", "row-reverse");
  }

  return concertEntry;
}

// fetch shows info
fetch("/api/shows/data")
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      let i = 0;

      if (data.data.filter(datum => !datum.archived).length === 0) {
        $("#no-upcoming-shows").show();
      }

      if (data.data.filter(datum => datum.archived).length === 0) {
        $("#no-past-shows").show();
      }
        
      for (let datum of data.data) {
        if (datum.archived) {
          $("#past-concert-entries").append(generateConcertEntry(datum, i));
        } else {
          $("#concert-entries").append(generateConcertEntry(datum, i));
        }
        i++;
      }
    }
  });

// view past shows
$("#view-past-shows").click(() => {
  $("#past-shows-title").show();
  $("#past-concert-entries").show();
  $("#view-past-shows").hide();
});