// loading button animation
class LoadingAnimation {
  constructor(element, size = 20, thickness = 2, color = "white") {
    this.element = element;
    this.thickness = thickness;
    this.initialHeight = element.outerHeight();
    this.initialWidth = element.outerWidth();
    this.color = color;
    this.initialPadding = {
      top: element.css("padding-top"),
      bottom: element.css("padding-bottom"),
      left: element.css("padding-left"),
      right: element.css("padding-right")
    };
    this.initialDisplay = element.css("display");
    this.text = element.text();
    this.size = size;
  }

  start() {
    const loadingCircle = $("<div id=\"loading-circle\"></div>");
    this.element.css("height", this.initialHeight + "px");
    this.element.css("width", this.initialWidth + "px");

    if (this.element.css("display") === "inline-block") {
      this.element.css("display", "inline-flex");
    } else {
      this.element.css("display", "flex");
    }

    this.element.css("justify-content", "center");
    this.element.css("align-items", "center");
    this.element.css("padding", "0");
    loadingCircle.css("border-top", this.thickness + "px solid " + this.color);
    loadingCircle.css("border-bottom", this.thickness + "px solid " + this.color);
    loadingCircle.css("border-left", this.thickness + "px solid transparent");
    loadingCircle.css("border-right", this.thickness + "px solid transparent");
    this.element.empty();
    this.element.append(loadingCircle);

    if (this.size != 20) {
      this.element.children().css("height", this.size + "px");
      this.element.children().css("width", this.size + "px");
    }
  }

  end() {
    this.element.empty();
    this.element.text(this.text);
    this.element.css("padding-top", this.initialPadding.top);
    this.element.css("padding-bottom", this.initialPadding.bottom);
    this.element.css("padding-left", this.initialPadding.left);
    this.element.css("padding-right", this.initialPadding.right);
    this.element.css("display", this.initialDisplay);
  }
}

// header message
class HeaderMessage {
  constructor(message, color, time = null) {
    $("#header-message-extensions").empty();
    
    this.message = message;

    if (color === "red") {
      this.color = "#e35b5b";
    } else {
      this.color = "#8acf8b";
    }

    this.time = time;
  }

  display() {
    const headerMessage = $("#header-message");
    const headerMessageText = $("#header-message-text");
    const headerMessageHide = $("#header-message-hide");

    headerMessageText.text(this.message);
    headerMessage.css("background", this.color);
    headerMessage.css("opacity", "1.0");
    headerMessage.css("display", "flex");

    if (this.time) {
      this.timeout = setTimeout(() => {
        let i = 0;
        this.interval = setInterval(() => {
          headerMessage.css("opacity", (1.0 - i * 0.02).toString());

          if (i === 99) {
            headerMessage.hide();
            clearInterval(this.interval);
          }

          i++;
        }, 1);
      }, this.time * 1000);
    }

    headerMessageHide.click(() => {
      headerMessage.hide();
      clearTimeout(this.timeout);
      clearInterval(this.interval);
    });
  }
}

// load header
$("header").load("/public/components/header.html", () => {
  // hamburger bar
  let hamburgerBarOpen = false;
  
  $("#header-hamburger").click((e) => {
    if (hamburgerBarOpen) {
      $("#header-hamburger").attr("src", "/public/images/header/hamburger.svg");
      $("#header-hamburger").css("height", "30px");
      $("#header-hamburger-links").hide();
    } else {
      $("#header-hamburger").attr("src", "/public/images/header/hamburgerExit.svg");
      $("#header-hamburger").css("height", "27px");
      $("#header-hamburger-links").css("display", "flex");
    }

    hamburgerBarOpen = !hamburgerBarOpen
  });
});

// load footer
$("footer").load("/public/components/footer.html");

// load fonts
fetch("/public/components/fontLinks.html")
  .then(response => response.text())
  .then(response => {
    $("head").get(0).innerHTML += response;
  });