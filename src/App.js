
import { useEffect, useState } from "react";
import axios from "axios";
import BootstrapButton from "react-bootstrap/Button";
import Card from 'react-bootstrap/Card';
import {
  VolumeDownFill, VolumeUpFill, VolumeMuteFill, Back,
  InfoSquareFill, RewindFill, PlayFill, PauseFill, FastForwardFill,
  StopFill, TvFill,
} from "react-bootstrap-icons";
import ReactBootstrapSlider from "react-bootstrap-slider";
import "./App.css";
import { Link } from "react-router";

const App = () => {

  const params = new URLSearchParams(document.location.search);
  let apiServer = params.get("apiServer");
  if (!apiServer) {
    const { protocol, hostname } = document.location;
    apiServer = `${protocol}//${hostname}:3001`;
  }
  let buttonSize = params.get("buttonSize") || "lg";
  let summaryOnly = params.get("summaryOnly") || false;

  const [state, setState] = useState({
    devices: [],
    volume: 0,
  });

  const defaultDisplayedDeviceObj = {
    json: "",
    device: {},
  };

  const [displayedDeviceObj, setDisplayedDeviceObj] = useState(defaultDisplayedDeviceObj);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const { data: { devices, volume } } = await axios.get(apiServer + "/api/devices");
        setState({ devices, volume });
      } catch (error) {
        alert("Error fetching the API: " + error);
        console.error("Error fetching the API", error);
      }
    };
    getDevices();
  }, [apiServer]);

  const send = (d, uri, params) => {
    const { host } = d;
    axios.post(apiServer + uri, { host, ...params })
      .then(() => axios.get(apiServer + "/api/devices"))
      .then(({ data: { devices, volume } }) => setState({ devices, volume }))
      .catch(console.error);
  };

  const showDevice = (device) => {
    const { uuid } = device;
    axios.get(apiServer + "/api/device", { params: { uuid } })
      .then(({ data }) => {
        const json = JSON.stringify(data, null, 2);
        setDisplayedDeviceObj({ json, device });
      });
  };

  const Button = ({ onClick, children }) =>
    <BootstrapButton size={buttonSize} variant="outline-dark" onClick={onClick} style={{ border: 0 }}>
      {children}
    </BootstrapButton>;

  const Volume = ({ device }) =>
    <div className="Volume">
      <Button onClick={() => send(device, "/api/volume/down")}>
        <VolumeDownFill />
      </Button>
      <span className="VolumeSlider">
        <ReactBootstrapSlider
          value={device.volume}
          slideStop={
            ({ target: { value } }) =>
              device.host
                ? send(device, "/api/volume/set", { value })
                : send(device, "/api/volume/change", { value: value - state.volume })
          }
          step={1}
          min={0}
          max={100}
          orientation="horizontal"
        />
        <Button onClick={() => send(device, "/api/volume/up")}>
          <VolumeUpFill />
        </Button>
      </span>
      <Button onClick={() => send(device, "/api/volume/toggleMute")}>
        <VolumeMuteFill />
      </Button>
      <Button onClick={() => send(device, "/api/volume/undo")}>
        <Back />
      </Button>
      {device.host &&
        <Button onClick={() => showDevice(device)}>
          <InfoSquareFill />
        </Button>}
    </div>;

  const Devices = () =>
    <div className="Devices">
      <table>
        <tbody>
          {state.devices
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((device) => (
              <tr key={device.uuid}>
                <th>{device.name}</th>
                <td className="DeviceVolume">
                  {device.volume}
                </td>
                <td className="VolumeRow">
                  <Volume device={device} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>;

  const summaryDevice = {
    uuid: "",
    host: "",
    volume: state.volume,
  };

  const SummaryControls = ({ device }) =>
    <div>
      <Button onClick={() => send(device, "/api/device/previous")}>
        <RewindFill />
      </Button>
      <Button onClick={() => send(device, "/api/device/pause")}>
        <PauseFill />
      </Button>
      <Button onClick={() => send(device, "/api/device/stop")}>
        <StopFill />
      </Button>
      <Button onClick={() => send(device, "/api/device/play")}>
        <PlayFill />
      </Button>
      <Button onClick={() => send(device, "/api/device/next")}>
        <FastForwardFill />
      </Button>
    </div>;

  const DisplayedDevice = ({ device }) => {
    const
      srvHost = device?.coordinator?.renderingcontrolservice?.host,
      srvPort = device?.coordinator?.renderingcontrolservice?.port || 80,
      relScpUrl = device?.coordinator?.renderingcontrolservice?.scpUrl,
      scpUrl = srvHost && relScpUrl && `http://${srvHost}:${srvPort}${relScpUrl}`;
    return (
      <Card className="CodeHeader">
        <Card.Title>{device.name}</Card.Title>
        <Card.Subtitle>{device.host}</Card.Subtitle>
        <Button
          variant="primary"
          onClick={() => setDisplayedDeviceObj(defaultDisplayedDeviceObj)}>
          Close
        </Button>
        <Card.Text>
          <ul>
            {scpUrl &&
              <li>
                <Link href={scpUrl} target="_blank">scpUrl</Link>
              </li>}
          </ul>
          <div className="Code">
            {displayedDeviceObj.json}
          </div>
        </Card.Text>
      </Card>
    );
  };


  return (
    <div className="App">
      <div className="Controls">
        <SummaryControls device={summaryDevice} />
        <Volume device={summaryDevice} />
        {!summaryOnly && <div>
          <br />
          <Devices />
        </div>}
      </div>
      {displayedDeviceObj.json &&
        <DisplayedDevice device={displayedDeviceObj.device} />}
    </div>
  );
};

export default App;