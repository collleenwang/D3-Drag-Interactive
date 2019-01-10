import * as d3 from 'd3'
import * as topojson from 'topojson'
import { debounce } from 'debounce'

let margin = { top: 100, left: 20, right: 20, bottom: 0 }

let height = 600 - margin.top - margin.bottom

let width = 1000 - margin.left - margin.right

let svg = d3
  .select('#chart-3')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

let projection = d3.geoMercator()
let path = d3.geoPath().projection(projection)
let linewidthScale = d3.scaleLinear().range([0, 5])

var div = d3
  .select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0)

Promise.all([
  d3.json(require('./data/world.topojson')),
  d3.csv(require('./data/country_coords_1975_2017.csv')),
  d3.csv(require('./data/refugee1975_2017.csv')),
  d3.csv(require('./data/america2017.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

let coordinateStore = d3.map()
// console.log(coordinateStore)

function ready([json, coordinateData, transitData, usaData]) {
  transitData = transitData.filter(d => d.Origin !== 'Stateless')

  // Make a list of ages
  let transitData1975 = transitData.filter(d => d.Year === '1975')
  // console.log(transitData1975)
  let coordinateData1975 = coordinateData.filter(d => d.year === '1975')
  // console.log(coordinateData1975)
  let transitData1995 = transitData.filter(d => d.Year === '1995')
  // console.log(transitData1995)
  let coordinateData1995 = coordinateData.filter(d => d.year === '1995')
  // console.log(coordinateData1995)
  let transitData2017 = transitData.filter(d => d.Year === '2017')
  // console.log(transitData2015)
  let coordinateData2017 = coordinateData.filter(d => d.year === '2017')
  // console.log(coordinateData2015)
  let countries = topojson.feature(json, json.objects.countries)

  var values = transitData.map(function(d) {
    return +d.value
  })

  var maxValue = d3.max(values)
  var minValue = d3.min(values)
  linewidthScale.domain([minValue, maxValue])

  coordinateData1975.forEach(d => {
    let name = d.country
    let coords = [d.lng, d.lat]
    coordinateStore.set(name, coords)
    // console.log(coordinateStore.set(name, coords))
  })

  coordinateData1995.forEach(d => {
    let name = d.country
    let coords = [d.lng, d.lat]
    coordinateStore.set(name, coords)
    // console.log(coordinateStore.set(name, coords))
  })

  coordinateData2017.forEach(d => {
    let name = d.country
    let coords = [d.lng, d.lat]
    coordinateStore.set(name, coords)
    // console.log(coordinateStore.set(name, coords))
  })

  svg
    .append('g')
    .selectAll('.country')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', '#CBC9CC')

  svg
    .append('path')
    .datum({ type: 'Sphere' })
    .attr('d', path)
    .attr('fill', '#2B2233')
    .lower()

  svg
    .selectAll('.country-point')
    .data(coordinateData1975)
    .enter()
    .append('circle')
    .attr('class', 'country-point')
    .attr('r', 3)
    .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
    .attr('fill',  '#f7545d')
    .attr('id', function(d, i) {
      return 'country' + i
    })
    .on('mousemove', function(d) {
      // console.log(d)
      div
        .html(d.country)
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
        .style('display', 'block')
    })
    .on('mouseover', function(d, i) {
      div.transition().style('opacity', 0.9)
      div
        .html(d.country)
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')

      d3.select('#country' + i)
        .transition()
        .style('stroke', 'white')
        .style('stroke-width', 2.5)
    })
    .on('mouseout', function(d, i) {
      div.transition().style('opacity', 0)
      d3.select('#country' + i)
        .transition()
        .style('stroke', 'none')
        .style('stroke-width', 0)
    })
    .style('visibility', 'hidden')

  svg
    .selectAll('.transit')
    .data(transitData1975)
    .enter()
    .append('path')
    .attr('class', 'transit')
    .attr('d', d => {
      // console.log(d.country)
      // console.log(coordinateStore.get(d.country))
      let fromCoords = coordinateStore.get(d.Origin)
      let toCoords = coordinateStore.get(d.country)

      var geoLine = {
        type: 'LineString',
        coordinates: [fromCoords, toCoords]
      }
      return path(geoLine)
    })
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', 1)
    .attr('opacity', 0.7)
    .attr('stroke-linecap', 'round')
    .style('visibility', 'hidden')

  // scroll to blank-graph
  d3.select('#blank').on('stepin', () => {
    // console.log('I scroll to blank graph')
    svg
      .selectAll('.country-point')
      .data(coordinateData1975)
      .transition()
      .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
      .attr('fill', 'red')
      .style('visibility', 'hidden')

    svg.selectAll('.transit').style('visibility', 'hidden')
  })

  // scroll to year 1975
  d3.select('#refugee1975').on('stepin', () => {
    // console.log('I scroll to 1975 graph')
    svg
      .selectAll('.country-point')
      .data(coordinateData1975)
      .transition()
      .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
      .attr('fill', '#f7545d')
      .style('visibility', 'visible')

    svg.selectAll('.transit').remove()

    svg
      .selectAll('.transit')
      .data(transitData1975)
      .enter()
      .append('path')
      .attr('class', 'transit')
      .attr('d', d => {
        // console.log(d.country)
        let fromCoords = coordinateStore.get(d.Origin)
        let toCoords = coordinateStore.get(d.country)

        var geoLine = {
          type: 'LineString',
          coordinates: [fromCoords, toCoords]
        }
        return path(geoLine)
      })
      .attr('fill', 'none')
      .attr('stroke', '#f7545d')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6)
      .attr('stroke-linecap', 'round')

  })

  // scroll to year 1995
  d3.select('#refugee1995').on('stepin', () => {
    // let transitData1995 = transitData.filter(d => d.Year === '1995')
    // console.log(transitData1995)
    // let coordinateData1995 = coordinateData.filter(d => d.year === '1995')
    // console.log(coordinateData1995)

    svg
      .selectAll('.country-point')
      .data(coordinateData1995)
      .transition()
      .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
      .attr('fill', '#f7545d')


    svg.selectAll('.transit').remove()

    svg
      .selectAll('.transit')
      .data(transitData1995)
      .enter()
      .append('path')
      .attr('class', 'transit')
      .attr('d', d => {
        let fromCoords = coordinateStore.get(d.Origin)
        let toCoords = coordinateStore.get(d.country)
        var geoLine = {
          type: 'LineString',
          coordinates: [fromCoords, toCoords]
        }
        return path(geoLine)
      })
      .attr('fill', 'none')
      .attr('stroke', '#f7545d')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.5)
      .attr('stroke-linecap', 'round')
  })

  // scroll to year 2015
  d3.select('#refugee2015').on('stepin', () => {
    svg
      .selectAll('.country-point')
      .data(coordinateData2017)
      .transition()
      .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
      .attr('fill', '#f7545d')

    svg.selectAll('.transit').remove()

    svg
      .selectAll('.transit')
      .data(transitData2017)
      .enter()
      .append('path')
      .attr('class', 'transit')
      .attr('d', d => {
        // console.log(d.country)
        // let usa = transitData2017.filter(d=> d.country ==='United States of America')
        // console.log(usa)
        // console.log(coordinateStore.get(d.country))
        let fromCoords = coordinateStore.get(d.Origin)
        // console.log(fromCoords)
        let toCoords = coordinateStore.get(d.country)
        // console.log(toCoords)
        var geoLine = {
          type: 'LineString',
          coordinates: [fromCoords, toCoords]
        }
        return path(geoLine)
      })
      .attr('fill', 'none')
      .attr('stroke', '#f7545d')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.5)
      .attr('stroke-linecap', 'round')
  })

  // scroll to 2017 usa
  d3.select('#refugeeus').on('stepin', () => {
    svg
      .selectAll('.country-point')
      .data(coordinateData2017)
      .transition()
      .attr('transform', d => `translate(${projection([d.lng, d.lat])})`)
      .attr('fill', '#f7545d')

    svg.selectAll('.transit').remove()

    svg
      .selectAll('.transit')
      .data(usaData)
      .enter()
      .append('path')
      .attr('class', 'transit')
      .attr('d', d => {
        // console.log(d.country)
        // console.log(coordinateStore.get(d.country))
        let fromCoords = coordinateStore.get(d.Origin)
        // console.log(fromCoords)
        let toCoords = coordinateStore.get(d.country)

        var geoLine = {
          type: 'LineString',
          coordinates: [fromCoords, toCoords]
        }
        return path(geoLine)
      })
      .attr('fill', 'none')
      .attr('stroke', '#f7545d')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.5)
      .attr('stroke-linecap', 'round')
  })
}
