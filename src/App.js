import React, { useState, useEffect } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";
import './App.css';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area
} from "recharts";

const token =  "mytoken";
const org = "myorg";
// const bucket = "mybucket";
const url = "http://localhost:8086";

let temperature_query = `from(bucket: "mybucket")
  |> range(start: -1h)
  // |> filter(fn: (r) => r["topic"] == "temperature")
  |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
  |> yield(name: "mean")
`

const InfluxChart = () => {
  const [tData, setTData] = useState([]);
  const [hData, setHData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let res = [];
    const influxQuery = async () => {
      //create InfluxDB client
      const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
      //make query
      await queryApi.queryRows(temperature_query, {
        next(row, tableMeta) {

          const o = tableMeta.toObject(row);
         //push rows from query into an array object
          res.push(o);
        },
        complete() {

          let temperature_data = []
          let humidity_data = []

          for(let i = 0; i < res.length; i++) {
            // Check the "topic" key for the current row
            if (res[i].topic === "temperature") {
              // If the topic is "temperature", push the row into the temperature_data array
              temperature_data.push(res[i])
            } else {
              // If the topic is not "temperature", push the row into the humidity_data array
              humidity_data.push(res[i])
            }
          }

          setTData(temperature_data);
          setHData(humidity_data);

          console.log(tData);
          console.log(hData);
        },
        error(error) {
          console.log("query failed- ", error);
        }
      });

    };
    influxQuery();
  }, [loading]);

  return (
  <div>
      <h1>Данные с датчика</h1>
      <h2>Текущая температура: {tData[tData.length - 1]?._value} °C</h2>
      <h2>Текущая влажность: {hData[hData.length - 1]?._value} %</h2>
      <ComposedChart width={900} height={400} data={tData}>
        <CartesianGrid />
        <Tooltip />
        <Line
          stroke="#0ff770"
          strokeWidth={1}
          dataKey="_value"
          dot={false}
        />
        <XAxis hide dataKey="_time" />
        <YAxis />
      </ComposedChart>
      <ComposedChart width={900} height={400} data={hData}>
        <CartesianGrid />
        <Tooltip />
        <Area stroke="#bf04b3" fill="#f235e6" dataKey="_value" />
        <XAxis hide dataKey="_time" />
        <YAxis />
      </ComposedChart>
      <button onClick={() => setLoading(!loading)}>Обновить</button>
    </div>
  )
};

function App() {
  return (
    <div className="App">
      <InfluxChart />
    </div>
  );
}

export default App;
