function createGalleryEntry(data) {
  let galleryEntry = $("<div class=\"gallery-show\"></div>");
  galleryEntry.html($("#gallery-show-template").html());

  galleryEntry.find(".gallery-show-name").text(data.name);

  for (let image of data.images) {
    let img = $("<img>");
    img.attr("src", "/public/images/gallery/" + image);
    img.addClass("gallery-show-image");

    img.click(() => {
      $("#gallery-image-viewer").attr("src", "/public/images/gallery/" + image);
      $("#gallery-image-viewer-container1").css("display", "flex");
    });
    
    galleryEntry
      .find(".gallery-show-images2")
      .append(img)
      .width(320 * data.images.length + 20);
  }

  $("#gallery-shows-container").append(galleryEntry);
}

$("#gallery-image-viewer-hide").click(() => {
  $("#gallery-image-viewer-container1").hide();
});

fetch("/api/gallery/data")
  .then(response => response.json())
  .then(response => {
    for (let i = response.length - 1; i >= 0; i--) {
      createGalleryEntry(response[i]);
    }
  });