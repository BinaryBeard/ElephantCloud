API Docs

POST /setup
Request:
{
  "screenCount": 3,
  "imageIDs": [
    1,
    2,
    3
  ],
  "elephantName": "Dumbo"
}
Response:
{
  "test_id": "742c9936-b11b-6cf8-311e-dd177feace66",
  "creation_date": "2019-04-11T13:15:44.196Z",
  "elephant_name": "Dumbo",
  "screen_count": 3,
  "image_references": [
    2,
    3,
    1
  ],
  "type": "setup"
}

POST /start
Request:
{
  "screenCount": 3,
  "testID": "22981fec-e537-693b-d082-f336fdf0b1b9"
}
Response:
{
  "test_id": "22981fec-e537-693b-d082-f336fdf0b1b9",
  "creation_date": "2019-04-11T13:14:57.359Z",
  "type": "start"
}

POST /stop
Request:
{
  "screenCount": 3,
  "testID": "22981fec-e537-693b-d082-f336fdf0b1b9"
}
Response:
{
  "test_id": "22981fec-e537-693b-d082-f336fdf0b1b9",
  "creation_date": "2019-04-11T13:17:14.683Z",
  "type": "stop"
}
