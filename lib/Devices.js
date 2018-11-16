/**
 * NodeRED Google SmartHome
 * Copyright (C) 2018 Michael Jacobsen.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

/******************************************************************************************************************
 * Devices
 *
 */
class Devices {
    constructor() {
        this._devices = {};
        this._nodes   = {};
        this._version = 0;
    }
    //
    //
    //
    NewLightOnOff(client, name) {
        this.debug('Devices:NewLightOnOff()');

        let device = { 
            id: client.id,
            properties: { 
                type: 'action.devices.types.LIGHT',
                traits: [ 'action.devices.traits.OnOff' ],
                name: { 
                    defaultNames: ["Node-RED On/Off Light"],
                    name: name
                },
                willReportState: true,
                attributes: {
                    //"colorModel": "rgb",
                    //"temperatureMinK": 2000,
                    //"temperatureMaxK": 6500
                },
                deviceInfo: { 
                    manufacturer: 'Node-RED',
                    model: 'nr-light-onoff-v1',
                    swVersion: '1.0',
                    hwVersion: '1.0' 
                },
                customData: { 
                    "nodeid": client.id,
                    "type": 'light-onoff'
                }
            },
            states: { 
              online: true, 
              on: false 
            }
        };
          
        return this.registerDevice(client, device);
    }
    //
    //
    //
    SetState(clientId, states) {
        let me = this;

        this.debug('Devices:SetState(): state = ' + JSON.stringify(states));

        if (!this._devices[clientId]) {
            me.debug('Device:SetState(): device does not exist');
            return false;
        }

        // update states
        Object.keys(states).forEach(function(key) {
            if (states.hasOwnProperty(key)) {
                me.debug('Device:SetState(): key = ' + JSON.stringify(key));
                me._devices[clientId].states[key] = states[key];
            }
        });

        this.reportState(clientId, this._devices[clientId].states);
    }
    //
    //
    //
    registerDevice(client, device) {
        if (!this._devices[device.id]) {
            this.debug('Device:registerDevice(): new device; device = ' + JSON.stringify(device));

            this._devices[device.id] = {
                states: {},
                properties: {},
                executionStates: [],
            };

            this._nodes[client.id] = client;

            return this.execDevice(device, false);
        } else {
            this.debug('Device:registerDevice(): device already exist; device = ' + JSON.stringify(device));
            return false;
        }
    }
    //
    //
    //
    execDevice(device, doUpdate) {
        let me = this;

        me.debug('Device:execDevice(): device = ' + JSON.stringify(device));

        if (!this._devices[device.id]) {
            me.debug('Device:execDevice(): device does not exist');
            return false;
        }

        if (device.hasOwnProperty('properties')) {
            // update properties
            Object.keys(device.properties).forEach(function(key) {
                if (device.properties.hasOwnProperty(key)) {
                    me.debug('Device:execDevice(): properties; key = ' + JSON.stringify(key));
                    me._devices[device.id].properties[key] = device.properties[key];
                }
            });
        }

        if (device.hasOwnProperty('states')) {
            // update states
            Object.keys(device.states).forEach(function(key) {
                if (device.states.hasOwnProperty(key)) {
                    me.debug('Device:execDevice(): states; key = ' + JSON.stringify(key));
                    me._devices[device.id].states[key] = device.states[key];
                }
            });
        }

        if (device.hasOwnProperty('executionStates')) {
            // update array of states
            me.debug('Device:execDevice(): executionStates = ' + JSON.stringify(device.executionStates));
            me._devices[device.id].executionStates = device.executionStates;
        }

        this._version++;

        me.debug('Device:execDevice(): this._devices = ' + JSON.stringify(this._devices));
        me.debug('Device:execDevice(): this._devices[device.id] = ' + JSON.stringify(this._devices[device.id]));


        if (doUpdate) {
            //console.log('Device:execDevice(): node = ', this._nodes[device.id]);
            this._nodes[device.id].updated(this._devices[device.id].states);
        }

        return true;
    }
    //
    //
    //
    getProperties(deviceIds = undefined) {
        let me = this;
        let properties = {};

        if (!deviceIds) {
            Object.keys(me._devices).forEach(function(deviceId) {
                if (me._devices.hasOwnProperty(deviceId)) {
                    properties[deviceId] = me._devices[deviceId].properties;
                }
            });
        } else {
            for (let i = 0; i < deviceIds.length; i++) {
                let deviceId = deviceIds[i];

                if (me._devices.hasOwnProperty(deviceId)) {
                    properties[deviceId] = me._devices[deviceId].properties;
                }
            }
        }
      
        this.debug('Device:getProperties(): properties = ' + JSON.stringify(properties));
      
        return properties;
    }
    //
    //
    //
    getStatus(deviceIds = undefined) {
        this.debug('Device:getStatus(): deviceIds = ' + JSON.stringify(deviceIds));

        if (!deviceIds || deviceIds == {} || (Object.keys(deviceIds).length === 0 && deviceIds.constructor === Object)) {
            this.debug('Device:getStatus(): no devices');
            return false;
            //return undefined;
        }
      
        let devices = {};

        for (let i = 0; i < deviceIds.length; i++) {
            let curId = deviceIds[i];

            if (!this._devices[curId]) {
                continue;
            }

            devices[curId] = this._devices[curId];
        }

        this.debug('Device:getStatus(): devices = ' + JSON.stringify(devices));

        return devices;
    }
    //
    //
    //
    getStates(deviceIds) {
        this.debug('Device:getStates(): deviceIds = ' + JSON.stringify(deviceIds));

        if (!deviceIds || !Object.keys(deviceIds).length) {
            this.debug('Device:getStates(): using empty device list');
            deviceIds = null;
        }

        let me     = this;
        let states = {};
          
        if (!deviceIds) {
            Object.keys(me._devices).forEach(function(deviceId) {
                if (me._devices.hasOwnProperty(deviceId)) {
                    states[deviceId] = me._devices[deviceId].states;
                }
            });
        } else {
            for (let i = 0; i < deviceIds.length; i++) {
                let deviceId = deviceIds[i];
                this.debug('Device:getStates(with-deviceIds): deviceId = ' + JSON.stringify(deviceId));

                if (me._devices.hasOwnProperty(deviceId)) {
                    states[deviceId] = me._devices[deviceId].states;
                    this.debug('Device:getStates(with-deviceIds): states[deviceId] = ' + JSON.stringify(states[deviceId]));
                }
            }
        }
          
        return states;
    }
    /**
     *
     * @param devices
     * [{
     *   "id": "123"
     * }, {
     *   "id": "234"
     * }]
     * @return {Array} ["123", "234"]
     */
    getDeviceIds(devices) {
        let deviceIds = [];

        for (let i = 0; i < devices.length; i++) {
            if (devices[i] && devices[i].id) {
                deviceIds.push(devices[i].id);
            }
        }

        return deviceIds;
    }
  
}

module.exports = Devices;

/*

HttpActions:httpActionsRegister(/smarthome): EXECUTE
HttpActions:_exec(): data = {"auth":"9fhnb0w6e1c000000000000000","requestId":"1083473088097569260","commands":[{"devices":[{"customData":{"nodeid":"cce69f06.e0866","type":"light-onoff"},"id":"cce69f06.e0866"}],"execution":[{"command":"action.devices.commands.OnOff","params":{"on":true}}]}]}
Device:execDevice(): device = {"id":"cce69f06.e0866","states":{"on":true}}
Device:execDevice(): states; key = "on"
Device:execDevice(): this._devices = {"cce69f06.e0866":{"states":{"online":true,"on":true},"properties":{"type":"action.devices.types.LIGHT","traits":["action.devices.traits.OnOff"],"name":{"defaultNames":["Node-RED On/off Lamp"],"name":"Kontor"},"willReportState":true,"attributes":{},"deviceInfo":{"manufacturer":"Node-RED","model":"nr-light-onoff-v1","swVersion":"1.0","hwVersion":"1.0"},"customData":{"nodeid":"cce69f06.e0866","type":"light-onoff"}},"executionStates":[]}}
HttpActions:_execDevice(): execDevice = undefined

Device:getStatus(): deviceIds = ["cce69f06.e0866"]
Device:getStatus(): devices = {"cce69f06.e0866":{"states":{"online":true,"on":true},"properties":{"type":"action.devices.types.LIGHT","traits":["action.devices.traits.OnOff"],"name":{"defaultNames":["Node-RED On/off Lamp"],"name":"Kontor"},"willReportState":true,"attributes":{},"deviceInfo":{"manufacturer":"Node-RED","model":"nr-light-onoff-v1","swVersion":"1.0","hwVersion":"1.0"},"customData":{"nodeid":"cce69f06.e0866","type":"light-onoff"}},"executionStates":[]}}
HttpActions:_execDevice(): executedDevice = {"cce69f06.e0866":{"states":{"online":true,"on":true},"properties":{"type":"action.devices.types.LIGHT","traits":["action.devices.traits.OnOff"],"name":{"defaultNames":["Node-RED On/off Lamp"],"name":"Kontor"},"willReportState":true,"attributes":{},"deviceInfo":{"manufacturer":"Node-RED","model":"nr-light-onoff-v1","swVersion":"1.0","hwVersion":"1.0"},"customData":{"nodeid":"cce69f06.e0866","type":"light-onoff"}},"executionStates":[]}}
HttpActions:_execDevice(): the device you want to control is offline
HttpActions:_exec(): executionResponse = {"status":"ERROR","errorCode":"deviceOffline"}
HttpActions:_exec(): no execution states were found for this device

*/