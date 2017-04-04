/**
 * Created by Greg on 11/25/2016.
 */
angular.module('pulsar.audio')
    //Audio Analysis
    .constant('audio.const.SampleRate', 44100)
    .constant('audio.const.MaxFrequency', 21050)
    .constant('audio.const.FrequencyRanges', [0, 60, 250, 2000, 6000, 21050]);