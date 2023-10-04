import { SonosManager, SonosDevice } from "@svrooij/sonos";

// https://stackoverflow.com/questions/22015684/zip-arrays-in-javascript
const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const serialize = (obj) => JSON.parse(JSON.stringify(obj));

const getDevicesAndVolume = async (sonos) => {
  const devices = await Promise.all(sonos.Devices.map(
    async (d) => ({ ...d, volume: await deviceVolume(d) })));
  const volume = Math.round(devices.map(d => d.volume).reduce((a, b) => a + b, 0) / devices.length);
  return { devices, volume, };
};

const deviceVolume = async (device) => {
  if (typeof device.Volume === "number") {
    return device.Volume;
  }
  if (typeof device.volume === "number") {
    return device.volume;
  }
  return await device.RenderingControlService.GetVolume({
    InstanceID: 0,
    Channel: "Master",
  }).then(v => v.CurrentVolume);
};

class Controller {
  constructor (sonos, history) {
    this._sonos = sonos;
    this._history = history;
  }

  changeVolumeBy = async (host, delta) =>
    Promise.all(this._devicesFromHost(host).map(d => this._changeVolumeBy(d, delta)));

  setVolume = async (host, delta) =>
    Promise.all(this._devicesFromHost(host).map(d => this._setVolume(d, delta)));

  toggleMute = async (host, delta) =>
    Promise.all(this._devicesFromHost(host).map(d => this._toggleMute(d, delta)));

  undo = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => this._undo(d)));

  getDevices = async () =>
    getDevicesAndVolume(this._sonos);

  getDeviceFromUUID = async (uuid) =>
    this.getDevices()
      .then(({ devices }) => devices.filter(d => d.uuid === uuid)[0]);

  deviceNext = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.Next()));

  devicePause = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.Pause()));

  deviceStop = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.Stop()));

  devicePlay = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.Play()));

  devicePrevious = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.Previous()));

  deviceTV = async (host) =>
    Promise.all(this._devicesFromHost(host).map(d => d.SwitchToTV()));

  _undo = async (device) =>
    this._setVolume(device, this._history[device.host].volume);

  _toggleMute = async (device) =>
    deviceVolume(device)
      .then(volume => volume === 0 ? this._history[device.host].volume : 0)
      .then(newVolume => this._setVolume(device, newVolume));

  _changeVolumeBy = async (device, delta) =>
    deviceVolume(device)
      .then(volume => this._setVolume(device, volume + delta));

  _devicesFromHost = (host) =>
    host ? [new SonosDevice(host)] : this._sonos.Devices;

  async _setVolume(device, newVolume) {
    if (newVolume < 0 || newVolume > 100) {
      return false;
    }
    const oldVolume = await deviceVolume(device);
    this._history[device.host] = serialize(Object.assign(device, { volume: oldVolume }));
    return device.SetVolume(newVolume);
  }

}

const findManager = async () => {
  const manager = new SonosManager();
  manager.GroupName;
  await manager.InitializeWithDiscovery();
  return manager;
};

const findManagerFallback = async () => {
  const hosts = [
    "192.168.1.195",
    "192.168.1.155",
    "192.168.1.156",
    "192.168.1.157",
    "192.168.1.154",
    "192.168.1.197",
  ];
  for (const host of hosts) {
    console.log("trying host: %s", host);
    try {
      const manager = new SonosManager();
      await manager.InitializeFromDevice(host);
      return manager;
    } catch (e) { console.log(e); };
  }
};

const findSonosManager = async () => {
  let manager;
  try {
    manager = await findManager();
  } catch (e) {
    console.error("while finding manager: %s", e);
  }
  if (!manager) {
    // If were're on VPN?
    manager = await findManagerFallback();
  }
  if (!manager) {
    throw new Error("couldn't find a Sonos manager");
  }
  manager.Devices.forEach(d => console.log('Device %s (%s) is joined in %s', d.Name, d.uuid, d.GroupName));
  return manager;
};

const newInstance = async () => {
  const sonos = await findSonosManager();
  const devicesWithVolumes = await getDevicesAndVolume(sonos);
  const history = Object.fromEntries(devicesWithVolumes.devices.map(d => [d.host, serialize(d)]));
  return new Controller(sonos, history);
};

export default newInstance;
