function Faderfox_DJ3 () {}

Faderfox_DJ3.knob_right_lim = 10
Faderfox_DJ3.knob_left_lim  = 117
Faderfox_DJ3.volume_step = 0.2
Faderfox_DJ3.mix_step = 0.1
Faderfox_DJ3.button_press = 0x93
Faderfox_DJ3.button_release = 0x83
Faderfox_DJ3.shiftcue_press = 0xb3
Faderfox_DJ3.seek_increment = 0.005
Faderfox_DJ3.seek_increment_fine = 0.0001
Faderfox_DJ3.switch_on = 0x7f
Faderfox_DJ3.switch_off = 0x00
Faderfox_DJ3.scratch_alpha = .125
Faderfox_DJ3.scratch_beta  = Faderfox_DJ3.scratch_alpha/32.
Faderfox_DJ3.isScratching = { "[Channel1]": false, "[Channel2]": false }
Faderfox_DJ3.default_loop_size = 1;
Faderfox_DJ3.loop_size = {"[Channel1]": 1, "[Channel2]": 1}
Faderfox_DJ3.loopIncrement = 4400;
Faderfox_DJ3.scratch_intervalsPerRev = 64;

/********************* Initialization ********************/
Faderfox_DJ3.init = function(id,debugging){
    engine.connectControl ( "[Channel1]", "bpm", "Faderfox_DJ3.nosync" );
    engine.connectControl ( "[Channel2]", "bpm", "Faderfox_DJ3.nosync" );
}
Faderfox_DJ3.shutdown = function(id){}

/********************* Callback ********************/

Faderfox_DJ3.master_volume = function(channel,control,value){
    Faderfox_DJ3.rotary_continuous (
            "[Master]", "volume",
            value, Faderfox_DJ3.volume_step, 0, 5 );
}

Faderfox_DJ3.head_volume = function(channel,control,value){
    Faderfox_DJ3.rotary_continuous (
            "[Master]", "headVolume",
            value, Faderfox_DJ3.volume_step, 0, 5 );
}

Faderfox_DJ3.head_mix = function(channel,control,value){
    Faderfox_DJ3.rotary_continuous (
            "[Master]", "headMix",
            value, Faderfox_DJ3.mix_step, -1, 1 );
}

Faderfox_DJ3.track_select = function(channel,control,value){
    Faderfox_DJ3.rotary_select ( "Track", value );
}

Faderfox_DJ3.playlist_select = function(channel,control,value){
    Faderfox_DJ3.rotary_select ( "Playlist", value );
}

Faderfox_DJ3.position_or_scratch = function ( channel, control, value, status, group ){
    print ( "isScratching["+group+"] = "+Faderfox_DJ3.isScratching[group] );
    if ( Faderfox_DJ3.isScratching[group] ) {
        Faderfox_DJ3.scratch_move ( group, value );
    } else {
        Faderfox_DJ3.rotary_continuous (
            group, "playposition",
            value, Faderfox_DJ3.seek_increment, 0, 1 );
    }
}

Faderfox_DJ3.seek_position = function ( channel, control, value, status, group ){
    Faderfox_DJ3.rotary_continuous (
            group, "playposition",
            value, Faderfox_DJ3.seek_increment_fine, 0, 1 );
}

/********************* Routines ********************/

Faderfox_DJ3.tweak_tempo_up = function ( channel, control, value, status, group ){
    /* Tweak tempo up while button is pressed

    group: [Channel1] or [Channel2]
    status: MIDI status code (typically button_press or button_release)
    */
    if ( status == Faderfox_DJ3.button_press ) {
        engine.setValue ( group, "rate_temp_up", 1 );
    } else if ( status == Faderfox_DJ3.button_release ) {
        engine.setValue ( group, "rate_temp_up", 0 );
    }
}

Faderfox_DJ3.tweak_tempo_down = function ( channel, control, value, status, group ){
    /* Tweak tempo down while button is pressed

    group: [Channel1] or [Channel2]
    status: MIDI status code (typically button_press or button_release)
    */
    if ( status == Faderfox_DJ3.button_press ) {
        engine.setValue ( group, "rate_temp_down", 1 );
    } else if ( status == Faderfox_DJ3.button_release ) {
        engine.setValue ( group, "rate_temp_down", 0 );
    }
}

Faderfox_DJ3.beatsync = function ( channel, control, value, status, group ) {
    engine.setValue ( group, "beatsync", 1 );
    if ( group == "[Channel1]" ) { midi.sendShortMsg ( 0x93, 0x58, 0x01 ); }
    else if ( group == "[Channel2]" ) { midi.sendShortMsg ( 0x93,0x5c,0x01 ); }
    engine.setValue ( group, "beatsync", 0 );
}

Faderfox_DJ3.loop_toggle = function ( channel, control, value, status, group ){
    if ( !engine.getValue ( group, "loop_enabled" ) ) {
        engine.setValue ( group, "beatloop", Faderfox_DJ3.loop_size[group] );
    } else {
        engine.setValue ( group, "reloop_exit", 1 );
    }
}

Faderfox_DJ3.loop_resize = function ( channel, control, value, status, group ){
    /* double or half the loop size using rotary knob */
    if ( Faderfox_DJ3.knob_direction ( value ) == 1 ) {
        Faderfox_DJ3.loop_size[group] = Faderfox_DJ3.loop_size[group] * 2;
    } else if ( Faderfox_DJ3.knob_direction ( value ) == -1 ) {
        Faderfox_DJ3.loop_size[group] = Faderfox_DJ3.loop_size[group] / 2;
    }
    engine.setValue ( group, "beatloop", Faderfox_DJ3.loop_size[group] );
}

Faderfox_DJ3.loop_reset = function ( channel, control, value, status, group ) {
    Faderfox_DJ3.loop_size[group] = Faderfox_DJ3.default_loop_size;
    if ( engine.getValue ( group, "loop_enabled" ) ) {
        engine.setValue ( group, "beatloop", Faderfox_DJ3.loop_size[group] );
    }
}

Faderfox_DJ3.loop_move = function ( channel, control, value, status, group ) {
    var start = engine.getValue ( group, "loop_start_position" );
    var stop  = engine.getValue ( group, "loop_end_position" );
    var direction = Faderfox_DJ3.knob_direction ( value );

    start = start + direction*Faderfox_DJ3.loopIncrement;
    stop  = stop  + direction*Faderfox_DJ3.loopIncrement;

    engine.setValue ( group, "loop_start_position", start );
    engine.setValue ( group, "loop_end_position",   stop );
}

Faderfox_DJ3.cup_button = function( channel, control, value, status, group ){
    /* Cup button behavior

    group: [Channel1] or [Channel2]
    status: MIDI status code (typically button_press or button_release)
    */

    if ( engine.getValue ( group, "duration")==0 ) { return; }

    if ( status == Faderfox_DJ3.button_press ) {
        engine.setValue ( group, "cue_gotoandstop", 1 );
    } else if ( status == Faderfox_DJ3.button_release ) {
        engine.setValue ( group, "cue_gotoandstop", 0 );
        engine.setValue ( group, "play", 1 );
    }
}

Faderfox_DJ3.cue_button = function( channel, control, value, status, group ){
    /* Cup button behavior
    Track is running: Press to jump to cue mark and stop playing
    Track is not running: Set cue mark
    Hold: preview

    group: [Channel1] or [Channel2]
    status: MIDI status code (typically button_press or button_release)
    */

    if ( engine.getValue ( group, "duration")==0 ) { return; }

    var currentlyPlaying = engine.getValue ( group, "play" );
    var cueposition      = engine.getValue ( group, "cue_point" );
    var curposition      = engine.getValue ( group, "playposition" );
    var nsamples         = engine.getValue ( group, "track_samples" );
    curposition = curposition*nsamples;

    if ( status == Faderfox_DJ3.button_press ) {
        if ( currentlyPlaying == 1 ) {
            engine.setValue ( group, "cue_preview", 1 );
        } else {
            if ( cueposition != curposition ) {
                engine.setValue ( group, "cue_set", 1 );
            }
            engine.setValue ( group, "cue_preview", 1 );
        }
    } else if ( status == Faderfox_DJ3.button_release ) {
        if ( engine.getValue ( group,"cue_preview" ) == 1 ) {
            engine.setValue ( group, "cue_gotoandstop", 1 );
            engine.setValue ( group, "cue_gotoandstop", 0 );
        }
    }
}

Faderfox_DJ3.pfl_toggle = function ( channel, control, value, status, group ) {
    /* toggle prefaderlistening for this group

    group: [Channel1] or [Channel2]
    value: emitted signal
    */
    if ( value == Faderfox_DJ3.switch_on ) {
        if ( engine.getValue ( group,"pfl" ) ) {
            engine.setValue ( group, "pfl",0 );
        } else {
            engine.setValue ( group, "pfl", 1 );
        }
    }
}

Faderfox_DJ3.keylock_toggle = function ( channel, control, value, status, group ){
    /* toggle keylock status

    group: [Channel1] or [Channel2]
    status: MIDI status code (button_press or button_release)
    */
    var state = engine.getValue ( group, "keylock" );

    if ( status == Faderfox_DJ3.shiftcue_press & value==0x7F) {
        if ( state == 1 ) {
            engine.setValue ( group, "keylock", 0 );
        } else {
            engine.setValue ( group, "keylock", 1 );
        }
    }
}

Faderfox_DJ3.toggle_scratching = function ( channel, control, value, status, group ) {
    var deck = 1;
    if ( group == "[Channel1]" ) { deck = 1; }
    else if ( group == "[Channel2]" ) { deck = 2; }

    if ( status == Faderfox_DJ3.button_press ) {
        engine.scratchEnable ( deck,
                Faderfox_DJ3.scratch_intervalsPerRev, 33.+1./3,
                Faderfox_DJ3.scratch_alpha, Faderfox_DJ3.scratch_beta );
        Faderfox_DJ3.isScratching[group] = true;
    } else if ( status == Faderfox_DJ3.button_release ) {
        engine.scratchDisable ( deck );
        Faderfox_DJ3.isScratching[group] = false;
    }

    print ( "isScratching["+group+"] = "+Faderfox_DJ3.isScratching[group] );
}

Faderfox_DJ3.scratch_move = function ( group, value ) {
    var deck = 1;
    if ( group == "[Channel1]" ) { deck = 1; }
    else if ( group == "[Channel2]" ) { deck = 2; }

    if ( !Faderfox_DJ3.isScratching[group] ) { return; }

    engine.scratchTick ( deck, Faderfox_DJ3.knob_direction ( value ) );
}

/********************* Utilities ********************/

Faderfox_DJ3.clip = function ( value, minimum, maximum ) {
    if ( value > maximum ) { return maximum; }
    if ( value < minimum ) { return minimum; }
    return value;
}

Faderfox_DJ3.knob_direction = function ( value ) {
    if ( value < Faderfox_DJ3.knob_right_lim ) { return 1; }
    if ( value > Faderfox_DJ3.knob_left_lim )  { return -1; }
}

Faderfox_DJ3.rotary_continuous = function ( group, key, value, increment, minimum, maximum ) {
    /* rotary knob to set a continuous key */
    var currentValue = engine.getValue ( group, key );
    currentValue = Faderfox_DJ3.clip (
            currentValue+Faderfox_DJ3.knob_direction ( value )*increment,
            minimum, maximum );
    engine.setValue ( group, key, currentValue );
}

Faderfox_DJ3.rotary_select = function ( key, value ) {
    if ( Faderfox_DJ3.knob_direction ( value ) == 1 ) {
       engine.setValue ( "[Playlist]", "SelectNext"+key, 1 ); 
    } else if ( Faderfox_DJ3.knob_direction ( value ) == -1 ) {
       engine.setValue ( "[Playlist]", "SelectPrev"+key, 1 ); 
    }
}

Faderfox_DJ3.calculate_loop_end = function ( group, loop_beats ) {
    var sample_rate = engine.getValue ( group, "track_samplerate" );
    var loop_begin  = engine.getValue ( group, "loop_start_position" );
    var bpm         = engine.getValue ( group, "bpm" );

    var loop_length_samples = Math.round(60*loop_beats*sample_rate / bpm);

    print ( "loop_length:"+loop_length_samples );

    return loop_begin + loop_length_samples;
}

Faderfox_DJ3.nosync = function ( value ) {
    midi.sendShortMsg ( 0x93, 0x58, 0x00 );
    midi.sendShortMsg ( 0x93,0x5c,0x00 );
}
