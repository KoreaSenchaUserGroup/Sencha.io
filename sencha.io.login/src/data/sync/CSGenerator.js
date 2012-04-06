
Ext.data.CSGenerator = Ext.extend(Object, {

	r: undefined, // replica_number
	t: undefined, // time, in seconds since epoch
	s: undefined, // sequence number
	
	clock: undefined,
	local_offset: undefined,
	global_offset: undefined,
	
	constructor: function(config) {
		this.set(config);
	},
	
	set: function(data) {
		if(data){
			this.clock= data.clock || new Ext.data.Clock();
			this.r= data.r;
		  this.t= data.t || this.clock.now();
		  this.s= data.s || -1; // so that the next tick gets us to 0
		  this.local_offset= data.local_offset || 0;
		  this.global_offset= data.global_offset || 0;
		}
	},
	
  generateChangeStamp: function() { // the next change stamp
    var current_time= this.clock.now();
    this.update_local_offset(current_time);
    this.s+= 1;
    if (this.s>255) { // JCM This is totally arbitrary, and it's hard coded too....
      this.t= current_time;
      this.local_offset+= 1;
      this.s= 0;
    }
		return new Ext.data.CS({r:this.r,t:this.global_time(),s:this.s});
  },

  seenCSV: function(csv) { // a change stamp vector we just received
		return this.seenChangeStamp(csv.maxChangeStamp());
	},

  seenChangeStamp: function(cs) { // a change stamp we just received
		var changed= false;
		if(cs){
	    var current_time= this.clock.now();
			if (current_time>this.t) {
		    changed= this.update_local_offset(current_time);
			}
	    changed= changed||this.update_global_offset(cs);
		}
		return changed;
  },
  
  setReplicaNumber: function(replica_number) {
		var changed= this.r!==replica_number;
		this.r= replica_number;
		return changed;
  },

	// private
  
  update_local_offset: function(current_time) {
		var changed= false;
    var delta= current_time-this.t;
    if (delta>0) { // local clock moved forwards
      var local_time= this.global_time();
      this.t= current_time;
      if (delta>this.local_offset) {
        this.local_offset= 0;
      } else {
        this.local_offset-= delta;
      }
      var local_time_after= this.global_time();
			if (local_time_after>local_time) {
      	this.s= -1;
			}
			changed= true;
    } else if (delta<0) { // local clock moved backwards
      // JCM if delta is too big, then complain
      this.t= current_time;
      this.local_offset+= -delta;
			changed= true;
    }
		return changed;
	},
	
	update_global_offset: function(remote_cs) {
		var changed= false;
    var local_cs= new Ext.data.CS({r:this.r,t:this.global_time(),s:this.s+1})
    var local_t= local_cs.t;
    var local_s= local_cs.s;
    var remote_t= remote_cs.t;
    var remote_s= remote_cs.s;
    if (remote_t==local_t && remote_s>=local_s) {
		  this.s= remote_s;
			changed= true;
    } else if (remote_t>local_t) {
      var delta= remote_t-local_t;
  		if (delta>0) { // remote clock moved forwards
  		  // JCM guard against moving too far forward
      	this.global_offset+= delta;
    		this.s= remote_s;
				changed= true;
      }
  	}
		return changed; 
  },

  global_time: function() {
    return this.t+this.local_offset+this.global_offset;
	},
	
	as_data: function() {
		var data= {
			r: this.r,
			t: this.t,
			s: this.s,
			local_offset: this.local_offset,
			global_offset: this.global_offset,
			id: 'generator'
		};
		data[Ext.data.SyncModel.MODEL]= 'Ext.data.CSGenerator';
		return data;
	},
	
});
