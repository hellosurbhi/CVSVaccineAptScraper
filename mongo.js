const mongoose = require('mongoose');

const mongoURL = "mongodb+srv://vaccinescript :lhWpkU5LnKmHovLD@cluster0.fb7v1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

const url =
  "mongodb+srv://vaccinescript:i5zGmcghMjx62LYD@cluster0.fb7v1.mongodb.net/vaccineAvailability?retryWrites=true&w=majority";

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const noteSchema = new mongoose.Schema({
  pharmacyName: String,
  pharmacyAddress: String,
  pharmacyAddress: String,
  availableDate: String,
  vaccine: String,
  searchedZipcode: String,
  date: Date,
});

const Note = mongoose.model("Vaccine data", noteSchema);


          const note = new Note({
            ...result[j],
            searchedZipcode: currentZipcode,
            date: new Date(),
          });

          await note
            .save()
            .then((result) => {
              console.log(
                "Vaccine data for zipcode " +
                  currentZipcode +
                  "saved in MongoDB!"
              );
              mongoose.connection.close();
            })
            .catch(console.error);
