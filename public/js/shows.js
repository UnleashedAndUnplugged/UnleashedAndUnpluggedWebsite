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
  concertEntry.find(".concert-entry-date-time").html(data.date + " &#x2022; " + data.time);
  concertEntry.find(".concert-entry-img").attr("src", "/public/images/shows/" + data.img);
  concertEntry.find(".concert-entry-description").text(data.description);

  if (num % 2 === 1) {
    concertEntry.find("div").css("flex-direction", "row-reverse");
  }

  $("#concert-entries").append(concertEntry);
}

// fetch shows info
fetch("/api/shows/data")
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      let i = 0;
      for (let datum of data.data) {
        generateConcertEntry(datum, i);
        i++;
      }
    }
  });