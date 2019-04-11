const AWS = require('aws-sdk')
const iotData = new AWS.IotData({ endpoint: 'a2638bvz51i7pu-ats.iot.us-east-1.amazonaws.com' })

exports.handler = async (event) => {
    console.log(JSON.stringify(event, null, 4))
    const body = JSON.parse(event.body)
    switch (event.resource) {
        case '/setup':
            return handleSetupEvent(body.screenCount, body.imageIDs, body.elephantName)
        case '/start':
            return handleStartEvent(body.testID, body.screenCount)
        case '/answer':
            return handleAnswerEvent(body.testID, body.screenCount, body.imageIDs, body.answerID)
        case '/stop':
            return handleStopEvent(body.testID, body.screenCount)
    }
}

function handleSetupEvent(screenCount, imageIDs, elephantName) {
    return new Promise((resolve, reject) => {
        if (screenCount !== imageIDs.length) {
            const message = 'Screen count does not match imageIDs'
            reject(buildResponse(400, { message }))
        }
        const testID = guid()

        shuffleArr(imageIDs)
        const promiseArr = []
        for (let i = 0; i < screenCount; i++) {
            const payload = { testID, imageID: imageIDs[i], screens: imageIDs }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const body = createTestSetupRecord(testID, elephantName, screenCount, imageIDs)
                    resolve(buildResponse(200, body))
                }
                else {
                    const message = 'Issue sending payload to screens'
                    reject(buildResponse(400, { message }))
                }
            })
            .catch((err) => {
                reject(buildResponse(500, { message: err.message }))
            })
    })
}

function handleStartEvent(testID, screenCount) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (let i = 0; i < screenCount; i++) {
            const payload = { ledState: 2, activateIR: true }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const body = createTestStartRecord(testID)
                    resolve(buildResponse(200, body))
                }
                else {
                    const message = 'Issue sending payload to screens'
                    reject(buildResponse(400, { message }))
                }
            })
            .catch((err) => {
                reject(buildResponse(500, { message: err.message }))
            })
    })
}

function handleAnswerEvent(testID, screenCount, imageIDs, answerInt) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (let i = 0; i < screenCount; i++) {
            const payload = { ledState: (answerInt === i + 1) ? 1 : 0, activateIR: false, screens: [] }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const body = createAnswerSetRecord(testID, imageIDs, answerInt)
                    resolve(buildResponse(200, body))
                }
                else {
                    const message = 'Issue sending payload to screens'
                    reject(buildResponse(400, { message }))
                }
            })
            .catch((err) => {
                reject(buildResponse(500, { message: err.message }))
            })
    })
}

function handleStopEvent(testID, screenCount) {
    return new Promise((resolve, reject) => {
        const promiseArr = []
        for (let i = 0; i < screenCount; i++) {
            const payload = {
                testID: '',
                imageID: 0,
                activateIR: false,
                ledState: 0,
                feederDuration: 0,
                screens: [],
            }
            promiseArr.push(sendPayloadToThing(`ElephantScreen${i + 1}`, payload))
        }

        return Promise.all(promiseArr)
            .then((responses) => {
                let goodResponses = true
                responses.forEach((response) => {
                    goodResponses = goodResponses && response
                })
                if (goodResponses) {
                    const body = createStopRecord(testID)
                    resolve(buildResponse(200, body))
                }
                else {
                    const message = 'Issue sending payload to screens'
                    reject(buildResponse(400, { message }))
                }
            })
            .catch((err) => {
                reject(buildResponse(500, { message: err.message }))
            })
    })
}

function shuffleArr(array) {
    let currentIndex = array.length, temporaryValue, randomIndex
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
}

function sendPayloadToThing(thingName, desired) {
    const params = {
        thingName: thingName,
        payload: JSON.stringify({ state: { desired } })
    }
    return iotData.updateThingShadow(params).promise()
        .then((data) => {
            return true
        })
        .catch((err) => {
            return false
        })
}

function createTestSetupRecord(testID, elephantName, screenCount, imageIDs) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        elephant_name: elephantName,
        screen_count: screenCount,
        image_references: imageIDs,
        type: 'setup'
    }

    console.log('STORING TEST SETUP RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createTestStartRecord(testID) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'start'
    }

    console.log('STORING TEST START RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createAnswerSetRecord(testID, imageIDs, selectedInt) {
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'answer',
        screens: []
    }

    for (let i = 0; i < 3; i++) {
        const screenData = {
            id: i + 1,
            image: imageIDs[i],
            selected: i + 1 === selectedInt
        }
        dataToStore.screens.push(screenData)
    }

    console.log('STORING ANSWER RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function createStopRecord(testID) {
    const isoDate = new Date().toISOString()
    const dataToStore = {
        test_id: testID,
        creation_date: new Date().toISOString(),
        type: 'stop'
    }
    console.log('STORING TEST END RECORD')
    console.log(JSON.stringify(dataToStore, null, 4))
    return dataToStore
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}

function buildResponse(statusCode, body) {
    return { statusCode, body: JSON.stringify(body) }
}
