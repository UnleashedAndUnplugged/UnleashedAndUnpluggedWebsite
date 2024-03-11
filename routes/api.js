// dependencies
const router = require("express").Router();
const fs = require("fs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

// multer
const upload = multer({ storage: multer.memoryStorage({}) });

// routes
router.post("/email", (req, res) => {
  if (typeof req.body.email === "string") {
    if (req.body.email.indexOf("@") !== -1 && req.body.email.indexOf("@") !== 0 && req.body.email.indexOf("@") !== req.body.email.length - 1) {
      fs.readFile("./storage/emails.txt", (err, data) => {
        if (data.toString().indexOf("\n" + req.body.email + "\n") === -1) {
          fs.writeFile("./storage/emails.txt", data.toString() + req.body.email.toLowerCase() + "\n", err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.status(201);
              res.json({ status: "success" });
            }
          });
        } else {
          res.status(409);
          res.json({ status: "failed", msg: "duplicate email" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid email address" });
    }
  } else {
    res.status(400);
    res.json({ status: "failed", msg: "no email provided" });
  }
});

router.post("/admin/login", (req, res) => {
  if (typeof req.body.password === "string") {
    if (req.body.password === process.env.ADMIN_PASSWORD) {
      res.json({ status: "success" });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "incorrect password" });
    }
  } else {
    res.status(400);
    res.json({ status: "failed", msg: "no password provided" });
  }
});

router.post("/admin/emails/list", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    fs.readFile("./storage/emails.txt", (err, data) => {
      if (err) {
        res.status(500);
        res.json({ status: "failed", msg: "internal server error" });
      } else {
        res.json({
          status: "success",
          emails: data.toString().split("\n").filter(email => email)
        });
      }
    });
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/unsubscribe", (req, res) => {
  function archiveDeletedEmail(email) {
    fs.readFile("./storage/deletedEmails.txt", (err, data) => {
      if (!err) {
        fs.writeFile("./storage/deletedEmails.txt", data.toString() + email + " (Unsubscribed)\n", err => {});
      }
    });
  }

  if (typeof req.body.email === "string") {
    fs.readFile("./storage/emails.txt", (err, data) => {
      if (err) {
        res.status(500);
        res.json({ status: "failed", msg: "internal server error" });
      } else {
        if (data.toString().indexOf(req.body.email) !== -1) {
          let index = data.toString().indexOf(req.body.email);
          let newFileVal = data.toString().substring(0, index) + data.toString().substring(index + req.body.email.length + 1);
          
          fs.writeFile("./storage/emails.txt", newFileVal, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              archiveDeletedEmail(req.body.email);
              res.json({ status: "success" });
            }
          });
        } else {
          res.status(400);
          res.json({ status: "failed", msg: "invalid email" });
        }
      }
    });
  } else {
    res.status(400);
    res.json({ status: "failed", msg: "invalid email" });
  }
});

router.post("/admin/emails/remove", (req, res) => {
  function archiveDeletedEmail(email) {
    fs.readFile("./storage/deletedEmails.txt", (err, data) => {
      if (!err) {
        fs.writeFile("./storage/deletedEmails.txt", data.toString() + email + "\n", err => {});
      }
    });
  }
  
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.email === "string") {
      fs.readFile("./storage/emails.txt", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          if (data.toString().indexOf(req.body.email) !== -1) {
            let index = data.toString().indexOf(req.body.email);
            let newFileVal = data.toString().substring(0, index) + data.toString().substring(index + req.body.email.length + 1);
            
            fs.writeFile("./storage/emails.txt", newFileVal, err => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
              } else {
                archiveDeletedEmail(req.body.email);
                res.json({ status: "success" });
              }
            });
          } else {
            res.status(400);
            res.json({ status: "failed", msg: "invalid email" });
          }
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid email" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/admin/email/send", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (Array.isArray(req.body.recipients) && typeof req.body.subject === "string" && typeof req.body.body === "string") {
      for (let recipient of req.body.recipients) {
        if (typeof recipient !== "string") {
          res.status(400);
          res.json({ status: "failed", msg: "invalid data" });
          return;
        }
      }
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "unleashedandunpluggedconcerts@gmail.com",
          pass: process.env.EMAIL_APP_PASSWORD
        }
      });

      for (let recipient of req.body.recipients) {
        const mailOptions = {
          from: "unleashedandunpluggedconcerts@gmail.com",
          to: recipient,
          subject: req.body.subject,
          html: req.body.body
        }
  
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            res.status(500);
            res.json({ status: "failed", msg: "internal server error" });
            return
          }
        });
      }

      res.json({ status: "success" });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/home/text", (req, res) => {
  fs.readFile("./storage/homePageText.txt", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ msg: "internal server error" });
    } else {
      res.json({ text: data.toString() });
    }
  });
});

router.post("/home/text", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.text === "string") {
      fs.readFile("./storage/homePageText.txt", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ msg: "internal server error" });
        } else {
          fs.writeFile("./storage/homePageText.txt", req.body.text, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.json({ status: "success" });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/home/imgs/extensions", (req, res) => {
  fs.readFile("./storage/homeImgExtensions.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
    } else {
      res.json({ data: JSON.parse(data.toString()) });
    }
  });
});

router.post("/home/imgs", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.imgNum === "string" && parseInt(req.body.imgNum) > 0 && parseInt(req.body.imgNum) <= 7 && req.file) {
      // get file extension
      const extension = path.extname(req.file.originalname);

      // get current extensions
      let currentExtensions;
      fs.readFile("./storage/homeImgExtensions.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          currentExtensions = JSON.parse(data);

          function afterDelete() {
            // add file
            fs.appendFile(`./public/images/home/home${req.body.imgNum}${extension}`, req.file.buffer, err => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
              } else {
                // update extension
                currentExtensions[req.body.imgNum - 1] = extension.substring(1);
                fs.writeFile("./storage/homeImgExtensions.json", JSON.stringify(currentExtensions), err => {
                  if (err) {
                    res.status(500);
                    res.json({ status: "failed", msg: "internal server error" });
                  } else {
                    res.json({ status: "success" });
                  }
                });
              }
            });
          }

          // delete old file
          try {
            fs.unlink(`./public/images/home/home${req.body.imgNum}.${currentExtensions[req.body.imgNum - 1]}`, afterDelete);
          } catch (e) {
            afterDelete();
          }
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/gallery/data", (req, res) => {
  fs.readFile("./storage/galleryData.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
    } else {
      res.json(JSON.parse(data));
    }
  });
});

router.post("/gallery/entry/new", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.name === "string") {
      fs.readFile("./storage/galleryData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          let jsonData = JSON.parse(data);
          let id = 0;

          for (let datum of jsonData) {
            if (datum.id > id) {
              id = datum.id;
            }
          }

          id++;

          jsonData.push({
            id: id,
            name: req.body.name,
            images: []
          });

          fs.writeFile("./storage/galleryData.json", JSON.stringify(jsonData), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.json({ 
                status: "success", 
                data: {
                  id: id
                }
              });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/gallery/entry/delete", (req, res) => {
  function removeGalleryImg(name) {
    fs.unlink("./public/images/gallery/" + name, () => {});
  }
  
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.id === "number") {
      fs.readFile("./storage/galleryData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          let jsonData = JSON.parse(data);

          // delete images
          for (let img of jsonData.filter(datum => datum.id === req.body.id)[0].images) {
            removeGalleryImg(img);
          }

          // delete data entry
          jsonData = jsonData.filter(datum => datum.id !== req.body.id);
          
          fs.writeFile("./storage/galleryData.json", JSON.stringify(jsonData), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.json({ status: "success" });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/gallery/entry/name", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.id === "number" && typeof req.body.name === "string") {
      fs.readFile("./storage/galleryData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          let jsonData = JSON.parse(data);

          for (let i = 0; i < jsonData.length; i++) {
            let datum = jsonData[i];
            
            if (datum.id === req.body.id) {
              jsonData[i].name = req.body.name;
              break;
            }
          }

          fs.writeFile("./storage/galleryData.json", JSON.stringify(jsonData), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.json({ status: "success" });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/gallery/image/upload", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (req.file && typeof req.body.id === "string") {
      req.body.id = parseInt(req.body.id);
      
      // get img number
      fs.readdir("./public/images/gallery", (err, files) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          let max = 0;
          for (let i = 0; i < files.length; i++) {
            let num = parseInt(files[i].substring(7, files[i].indexOf(".")));

            if (num > max) {
              max = num;
            }
          }
          
          // upload img
          const imgNum = max + 1;
          const extension = path.extname(req.file.originalname);

          fs.appendFile(`./public/images/gallery/gallery${imgNum}${extension}`, req.file.buffer, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              // add img to gallery data
              fs.readFile("./storage/galleryData.json", (err, data) => {
                if (err) {
                  res.status(500);
                  res.json({ status: "failed", msg: "internal server error" });
                } else {
                  let jsonData = JSON.parse(data);

                  for (let i = 0; i < jsonData.length; i++) {
                    if (jsonData[i].id === req.body.id) {
                      jsonData[i].images.push(`gallery${imgNum}${extension}`);
                      break;
                    }
                  }

                  fs.writeFile("./storage/galleryData.json", JSON.stringify(jsonData), err => {
                    if (err) {
                      res.status(500);
                      res.json({ status: "failed", msg: "internal server error" });
                    } else {
                      res.json({ status: "success" });
                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/gallery/image/delete", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.imgName === "string") {
      fs.readFile("./storage/galleryData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          let jsonData = JSON.parse(data);

          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i].images.includes(req.body.imgName)) {
              jsonData[i].images.splice(jsonData[i].images.indexOf(req.body.imgName), 1);
            }
          }

          fs.writeFile("./storage/galleryData.json", JSON.stringify(jsonData), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              fs.unlink("./public/images/gallery/" + req.body.imgName, () => {});
              res.json({ status: "success" });
            }
          });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/general-page/:page/text", (req, res) => {
  if (typeof req.params.page === "string") {
    let fileUrl = null;
    switch (req.params.page) {
      case "houseRules":
        fileUrl = "./storage/houseRulesPageText.txt";
        break;
      case "artists":
        fileUrl = "./storage/artistsPageText.txt";
        break;
    }

    if (fileUrl) {
      fs.readFile(fileUrl, (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          res.json({ status: "success", data: data.toString() });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  }
});

router.post("/general-page/text", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.text === "string" && typeof req.body.page === "string") {
      fs.writeFile(`./storage/${req.body.page}PageText.txt`, req.body.text, err => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          res.json({ status: "success" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  }
});

router.post("/general-page/img", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (req.file && typeof req.body.page === "string") {
      // get file extension
      const extension = path.extname(req.file.originalname);

      // get current extension
      let currentExtensions;
      fs.readFile("./storage/generalPagesImgExtensions.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }
        currentExtensions = JSON.parse(data);

        function afterDelete() {
          // add file
          fs.appendFile(`./public/images/${req.body.page}/${req.body.page}${extension}`, req.file.buffer, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              // update extension
              currentExtensions[req.body.page] = extension.substring(1);
              fs.writeFile("./storage/generalPagesImgExtensions.json", JSON.stringify(currentExtensions), err => {
                if (err) {
                  res.status(500);
                  res.json({ status: "failed", msg: "internal server error" });
                } else {
                  res.json({ status: "success" });
                }
              });
            }
          });
        }

        // delete old file
        try {
          fs.unlink(`./public/images/${req.body.page}/${req.body.page}.${currentExtensions[req.body.page]}`, afterDelete);
        } catch (e) {
          afterDelete();
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/general-page/extensions", (req, res) => {
  fs.readFile("./storage/generalPagesImgExtensions.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
    } else {
      res.json({ status: "success", data: JSON.parse(data) });
    }
  });
});

router.get("/shows/data", (req, res) => {
  fs.readFile("./storage/showsPageData.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
    } else {
      res.json({ status: "success", data: JSON.parse(data) });
    }
  });
});

router.post("/shows/new", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (req.file && typeof req.body.name === "string" && typeof req.body.date === "string" && typeof req.body.time === "string" && typeof req.body.description === "string") {
      // get current data
      fs.readFile("./storage/showsPageData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }
        data = JSON.parse(data);

        // get new entry id
        let showId = 0;
        for (let datum of data) {
          if (datum.id > showId) {
            showId = datum.id;
          }
        }
        showId++;

        // get image extension
        const extension = path.extname(req.file.originalname);

        // upload image
        fs.appendFile(`./public/images/shows/concert${showId}${extension}`, req.file.buffer, err => {
          if (err) {
            res.status(500);
            res.json({ status: "failed", msg: "internal server error" });
            return;
          }

          // edit data
          let showData = {
            id: showId,
            name: req.body.name,
            date: req.body.date,
            time: req.body.time,
            description: req.body.description,
            img: `concert${showId}${extension}`,
            archived: false
          };
          
          data.push(showData);

          // update data
          fs.writeFile("./storage/showsPageData.json", JSON.stringify(data), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
              return;
            } else {
              res.json({ status: "success", data: { showData: showData } });
            }
          });
        });

      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/shows/update-info", async (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.id === "number") {
      fs.readFile("./storage/showsPageData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        data = JSON.parse(data);
        let showData = data.filter(datum => datum.id === req.body.id)[0];

        if (showData) {
          if (typeof req.body.name === "string") {
            showData.name = req.body.name;
          }
  
          if (typeof req.body.date === "string") {
            showData.date = req.body.date;
          }
  
          if (typeof req.body.time === "string") {
            showData.time = req.body.time;
          }
  
          if (typeof req.body.description === "string") {
            showData.description = req.body.description;
          }

          if (typeof req.body.archived === "boolean") {
            showData.archived = req.body.archived;
          }
  
          let newData = [];
  
          for (let i = 0; i < data.length; i++) {
            if (data[i].id === req.body.id) {
              newData.push(showData);
            } else {
              newData.push(data[i]);
            }
          }
  
          fs.writeFile("./storage/showsPageData.json", JSON.stringify(newData), (err) => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              res.json({ status: "success" });
            }
          });
        } else {
          res.status(400);
          res.json({ status: "failed", msg: "invalid data" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/shows/update-img", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (req.file && typeof req.body.id === "string") {
      fs.readFile("./storage/showsPageData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        data = JSON.parse(data);
        
        function afterDelete(fileName, showData) {
          // add file
          fs.appendFile("./public/images/shows/" + fileName, req.file.buffer, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            } else {
              // change file name in data
              showData.img = fileName;
              let newData = [];

              for (let datum of data) {
                if (datum.id === parseInt(req.body.id)) {
                  newData.push(showData);
                } else {
                  newData.push(datum);
                }
              }

              fs.writeFile("./storage/showsPageData.json", JSON.stringify(newData), err => {
                if (err) {
                  res.status(500);
                  res.json({ status: "failed", msg: "internal server error" });
                  return;
                }

                res.json({ status: "success", data: { imgName: fileName } });
              });
            }
          });
        }
    
        // delete old file
        let showData = data.filter(datum => datum.id === parseInt(req.body.id))[0];

        if (showData) {
          const extension = path.extname(req.file.originalname);
          const fileName = "concert" + req.body.id + extension;
          
          try {
            fs.unlink("./public/images/shows/" + showData.img, () => afterDelete(fileName, showData));
          } catch (e) {
            afterDelete(fileName, showData);
          }
        } else {
          res.status(400);
          res.json({ status: "failed", msg: "invalid data" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/shows/delete", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.id === "number") {
      fs.readFile("./storage/showsPageData.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        data = JSON.parse(data);

        // delete image
        let showData = data.filter(datum => datum.id === req.body.id)[0];

        if (showData) {
          fs.unlink("./public/images/shows/" + showData.img, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
              return;
            }

            // delete data
            let newData = data.filter(datum => datum.id !== req.body.id);

            fs.writeFile("./storage/showsPageData.json", JSON.stringify(newData), err => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
                return;
              }

              res.json({ status: "success" });
            });
          });
        } else {
          res.status(400);
          res.json({ status: "failed", msg: "invalid data" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/settings", (req, res) => {
  fs.readFile("./storage/siteSettings.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
      return;
    }

    res.json({ status: "success", data: JSON.parse(data) });
  });
});

router.post("/settings", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.json === "string") {
      fs.writeFile("./storage/siteSettings.json", JSON.stringify(req.body.json), err => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
        } else {
          res.json({ status: "success" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.get("/logo", (req, res) => {
  fs.readFile("./storage/siteSettings.json", (err, data) => {
    if (err) {
      res.status(500);
      res.json({ status: "failed", msg: "internal server error" });
      return;
    }

    let fileName = JSON.parse(data).logo;
    res.sendFile(path.join(__dirname, "../public/images/" + fileName));
  });
});

router.post("/logo", upload.single("file"), (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (req.file) {
      fs.readFile("./storage/siteSettings.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        let fileName = JSON.parse(data).logo;

        fs.unlink("./public/images/" + fileName, err => {
          if (err) {
            res.status(500);
            res.json({ status: "failed", msg: "internal server error" });
          }

          let newFileName = "logo" + path.extname(req.file.originalname);
          fs.appendFile("./public/images/" + newFileName, req.file.buffer, err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
            }

            let newSettings = JSON.parse(data);
            newSettings.logo = newFileName;

            fs.writeFile("./storage/siteSettings.json", JSON.stringify(newSettings), err => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
              } else {
                res.json({ status: "success" });
              }
            });
          });
        });
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/font/import", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.embed === "string" && typeof req.body.name === "string") {
      // add font link
      fs.readFile("./public/components/fontLinks.html", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        let text = data.toString() + req.body.embed;

        fs.writeFile("./public/components/fontLinks.html", text, err => {
          if (err) {
            res.status(500);
            res.json({ status: "failed", msg: "internal server error" });
            return;
          }

          // add font to options
          fs.readFile("./storage/siteSettings.json", (err, data) => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
              return;
            }

            let json = JSON.parse(data);
            json.fonts.push(req.body.name);

            fs.writeFile("./storage/siteSettings.json", JSON.stringify(json), err => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
                return;
              }

              res.json({ status: "success" });
            });
          });
        });
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/font/set", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    if (typeof req.body.mainFont === "string" && typeof req.body.headerFont === "string") {
      // update site settings
      fs.readFile("./storage/siteSettings.json", (err, data) => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        let settings = JSON.parse(data);

        if ((settings.fonts.includes(req.body.mainFont) || req.body.mainFont === "Ubuntu") && (settings.fonts.includes(req.body.headerFont) || req.body.headerFont === "Ubuntu")) {
          settings.mainFont = req.body.mainFont;
          settings.headerFont = req.body.headerFont;
          
          fs.writeFile("./storage/siteSettings.json", JSON.stringify(settings), err => {
            if (err) {
              res.status(500);
              res.json({ status: "failed", msg: "internal server error" });
              return;
            }

            fs.readFile("./public/css/main.css", (err, data) => {
              if (err) {
                res.status(500);
                res.json({ status: "failed", msg: "internal server error" });
                return;
              }

              let css = data.toString();

              // set main font
              let preStr = "* {\n  font-family: ";
              let startIndex = css.indexOf(preStr);
              let endIndex = css.indexOf(";");

              css = css.substring(0, startIndex + preStr.length) + '"' + req.body.mainFont + '"' + ", Ubuntu" + css.substring(endIndex);

              // set header font
              preStr = ".header {\n  font-family: ";
              startIndex = css.indexOf(preStr);
              endIndex = css.indexOf(";", startIndex);

              css = css.substring(0, startIndex + preStr.length) + '"' + req.body.headerFont + '"' + ", Ubuntu" + css.substring(endIndex);

              // update css file
              fs.writeFile("./public/css/main.css", css, err => {
                if (err) {
                  if (err) {
                    res.status(500);
                    res.json({ status: "failed", msg: "internal server error" });
                    return;
                  }
                }

                res.json({ status: "success" });
              });
            });
          });
        } else {
          res.status(400);
          res.json({ status: "failed", msg: "invalid data" });
        }
      });
    } else {
      res.status(400);
      res.json({ status: "failed", msg: "invalid data" });
    }
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

router.post("/font/reset", (req, res) => {
  if (typeof req.body.password === "string" && req.body.password === process.env.ADMIN_PASSWORD) {
    fs.readFile("./storage/siteSettings.json", (err, data) => {
      if (err) {
        res.status(500);
        res.json({ status: "failed", msg: "internal server error" });
        return;
      }

      let settings = JSON.parse(data);

      settings.fonts = [];
      settings.mainFont = "Ubuntu";
      settings.headerFont = "Ubuntu";

      fs.writeFile("./storage/siteSettings.json", JSON.stringify(settings), err => {
        if (err) {
          res.status(500);
          res.json({ status: "failed", msg: "internal server error" });
          return;
        }

        fs.writeFile("./public/components/fontLinks.html", "", err => {
          if (err) {
            res.status(500);
            res.json({ status: "failed", msg: "internal server error" });
            return;
          }

          res.json({ status: "success" });
        });
      });
    });
  } else {
    res.status(403);
    res.json({ status: "failed", msg: "incorrect admin password" });
  }
});

// export router
module.exports = router;