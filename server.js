const express = require("express");
const app = express();
let fetch = require("node-fetch");
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cheerio = require("cheerio");
const rq = require("request");

app.post("/webhook", async function (request, response) {
  var intentName = request.body.queryResult.intent.displayName;

  if ((intentName = "give_project")) {
    var type_project = request.body.queryResult.parameters["type_project"];
    let url;
    if (type_project == "") {
      url = "https://create.arduino.cc/projecthub";
    } else
      url = "https://create.arduino.cc/projecthub/search?q=" + type_project;
    console.log(url);
    getProject(url, response);
  } else {
    response.json({
      fulfillmentText: "Ask me a project.",
    });
  }
});

// listen for requests
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

function getRandomNumber(max) {
  return Math.floor(Math.random() * max);
}

async function getProject(url, response_chatbot) {
  let list_projects = [];
  rq(url, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const projects = $(".mobile-scroll-row-item");
      projects.each((i, el) => {
        const title = $(el)
          .find(".thumb-inner")
          .find(".project-link-with-ref")
          .text();
        const description = $(el)
          .find(".thumb-image")
          .find(".thumb-image-inner-top")
          .text();
        const imageUrl = $(el)
          .find(".project-thumb-img")
          .attr("data-async-src");
        const urlProject = $(el).find("a").attr("href");
        if (imageUrl != null) {
          list_projects.push({
            title: title,
            description: description,
            imageUrl: imageUrl,
            urlProject: urlProject,
          });
        } else {
          list_projects.push({
            title: title,
            description: description,
            urlProject: urlProject,
          });
        }
      });
      var one_project = list_projects[getRandomNumber(list_projects.length)];

      try {
        response_chatbot.json({
          fulfillmentText: `Title: ${one_project.title} \n\nDescription: ${one_project.description} \n\nFor more information: https://create.arduino.cc/projecthub${one_project.urlProject}`,
        });
      } catch (e) {
        response_chatbot.json({
          fulfillmentText: `We have a problem, try again.`,
        });
      }
    } else console.log(error);
  });
}
