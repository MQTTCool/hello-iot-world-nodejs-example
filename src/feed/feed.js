/*
  MQTT.Cool - http://www.lightstreamer.com
  Hello IoT World Demo

  Copyright (c) Lightstreamer Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
const mqtt = require('mqtt');

// Connect to the MQTT broker listening at localhost on port 1883.
const client = mqtt.connect('mqtt://localhost:1883');

// Upon successful connection, start simulation.
client.on('connect', function () {
  var tick = 100; // Tick interval in ms.
  var startTimeMillis = Date.now(); // Take current timestamp in ms.
  var totalTimeSec = 0; // Total time in seconds.
  var lastTimeMills = startTimeMillis; // Used to save last timestamp.

  var limit = 135; // Speed limit to determine speed variation range.
  var baseSpeed = 215; // Base speed limit to determine speed variation range.
  var lastSpeedKmH = 130; // Initial simulated speed in Km/h, also used to save last determined speed

  var totalDistanceMeter = 0; // Total distance covered in meters.

  // Fixed thresholds to determine RPM calculation.
  var gearThresholds = [90, 150, 220, 300, 320];
  var gearRatios = [250, 400, 300, 250, 1000, 660];
  var baseRPM = 2000;

  // Start generating simulated metrics at tick interval.
  setInterval(function () {
    // Simulate speed variation.
    var ratio = (lastSpeedKmH - baseSpeed) / limit;
    var direction = 1;
    if (ratio < 0) {
      direction = -1;
    }
    ratio = Math.min(Math.abs(ratio), 1);
    var weight = (ratio * ratio * ratio);
    var prob = (1 - weight) / 2;
    if (!(Math.random() < prob)) {
      direction = direction * -1;
    }
    var difference = Math.round(Math.random() * 3) * direction;
    var speedKmH = lastSpeedKmH + difference;

    // Calculate current RPM.
    var diff = speedKmH;
    var i = 0;
    for (i = 0; i < gearThresholds.length; i++) {
      if (speedKmH < gearThresholds[i]) {
        break;
      }
    }
    if (i > 0) {
      diff = speedKmH - gearThresholds[i - 1];
    }
    var rpm = baseRPM + gearRatios[i] * diff;

    // Calculate time interval since last invocation.
    var timeMillis = Date.now();
    var deltaTimeMillis = timeMillis - lastTimeMills;

    // Accumulate total time, actually not used.
    totalTimeSec = totalTimeSec + deltaTimeMillis / 1000;

    // Calculate distance covered since last invocation.
    var deltaDistanceMeter = speedKmH * deltaTimeMillis / 3600;

    // Accumulate total distance covered, actually not used.
    totalDistanceMeter = totalDistanceMeter + deltaDistanceMeter;

    // Salve metrics to be used on next invocation.
    lastSpeedKmH = speedKmH;
    lastTimeMills = timeMillis;

    // Publish metrics to the MQTT broker.
    client.publish('telemetry/speed', speedKmH.toFixed(0));
    client.publish('telemetry/rpm', String(rpm));
  }, tick);
});
