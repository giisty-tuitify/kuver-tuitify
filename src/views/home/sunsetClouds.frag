uniform vec3 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iChannel0;
uniform float iTravel;



//STARNEST
#define iterations 12
#define formuparam 0.453

#define volsteps 20
#define stepsize 0.1

#define zoomS   0.800
#define tile   0.850
#define speed  0.0015 

#define brightness 0.0015
#define darkmatter 0.300
#define distfading 0.730
#define saturation 0.850

//clouds
#define SAMPLE_COUNT 6
#define DIST_MAX 40.
#define SAMPLES_ADAPTIVITY 0.02

// cam moving in a straight line
vec3 lookDir = vec3(-1.,0.,0.5);
vec3 camVel = vec3(-1.,0.,0.);
float zoom = 1.8; // 1.5;

// cam spin around on spot
float samplesCurvature = 2.8; // can mix between fixed z and fixed radius sampling

vec3 sundir = normalize(vec3(-1.0,0.0,-1.));

vec4 stars(in vec2 fragCoord){
//get coords and direction
	vec2 uv=fragCoord.xy/iResolution.xy-.5;
	uv.y*=iResolution.y/iResolution.x;
	vec3 dir=vec3(uv*zoomS,1.);
	float time=iTime*speed+.25;

	//mouse rotation
	float a1=.05+iMouse.x/iResolution.x*0.01;
	float a2=.08+iMouse.y/iResolution.y*0.02;
	mat2 rot1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1));
	mat2 rot2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2));
	dir.xz*=rot1;
	dir.xy*=rot2;
	vec3 from=vec3(1.,.5,0.5);
	from+=vec3(time*2.,time,-2.);
	from.xz*=rot1;
	from.xy*=rot2;
	
	//volumetric rendering
	float s=0.1,fade=1.;
	vec3 v=vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) { 
			p=abs(p)/dot(p,p)-formuparam; // the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		if (r>6) fade*=1.-dm; // dark matter, don't render near
		//v+=vec3(dm,dm*.5,0.);
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	return vec4(v*.01,1.);	
}

// LUT based 3d value noise
float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;
    return mix( rg.x, rg.y, f.z );
}


vec4 map( in vec3 p )
{
	float d = 0.1 + .8 * sin(0.6*p.z)*sin(0.5*p.x) - p.y;

    vec3 q = p;
    float f;
    
    f  = 0.5000*noise( q ); q = q*2.02;
    f += 0.2500*noise( q ); q = q*2.03;
    f += 0.1250*noise( q ); q = q*2.01;
    f += 0.0625*noise( q );
    d += 2.75 * f;

    d = clamp( d, 0.0, 1.0 );
    
    vec4 res = vec4( d );
    
    vec3 col = 1.15 * vec3(1.0,0.95,0.8);
    col += vec3(1.,0.,0.) * exp2(res.x*10.-10.);
    res.xyz = mix( col, vec3(0.7,0.7,0.7), res.x );
    
    return res;
}

// compute desired spacing between samples, modelled as a 1/z curve
float spacing(float t )
{
    // restrict to domain
    t = max(t,0.);
    
    // unnorm pdf - plot this in graphtoy to see shape
    float pdf = 1. / (SAMPLES_ADAPTIVITY*t + 1.);
	// integral of pdf over dist
	float norm = (1. / SAMPLES_ADAPTIVITY)*log(1. + SAMPLES_ADAPTIVITY*DIST_MAX);
    // norm pdf
    pdf /= norm;
    
    // sample spacing for our sample count
    return 1. / (float(SAMPLE_COUNT) * pdf);
}

// mod but moves the boundaries to keep them stationary with the camera
float mov_mod( float x, float y )
{
    return mod(x + dot(camVel*iTime,lookDir), y) ;
}

bool on_boundary( float x, float y )
{
    // the +0.25 solves numerical issues without changing the result
    float numericalFixOffset = y*0.25;
    return mov_mod( x + numericalFixOffset, y ) < y*0.5;
}

// put t on an appropriate sample location and initialise sampling data
void firstT( out float t, out float dt, out float wt, out bool even )
{
    dt = exp2(floor(log2(spacing(0.))));
    t = dt - mov_mod(t,dt);
    even = on_boundary(t,2.*dt);
    wt = 1.;
}

// advance t to next sample location
void nextT( inout float t, inout float dt, inout float wt, inout bool even )
{
    float s = spacing(t); // get desired sample spacing
    if( s < dt ) { dt /= 2.; even = true; } // can immediately move to higher density
    else if( even && s > 2.*dt ) { dt *= 2.; wt = 1.; even = on_boundary(t,2.*dt); } // move to lower density if a sample is there

    if( even ) wt = clamp( 2. - s/dt,0.,1.); // update wt for next odd sample - based on how far this even sample is into its band
    
    // next sample
    t += dt;
    even = !even;
}

// wt for blending in/out samples without pops
float sampleWt( float wt, bool even )
{
    return even ? (2.-wt) : wt;
}

vec4 raymarch( in vec3 ro, in vec3 rd )
{
    vec4 sum = vec4(0, 0, 0, 0);
    
    // setup sampling
    float t, dt, wt; bool even;
    firstT( t, dt, wt, even );
    
    for(int i=0; i<SAMPLE_COUNT; i++)
    {
        if( sum.a > 0.99 ) continue;

        vec3 pos = ro + t*rd;
        vec4 col = map( pos );
        
        // iqs goodness
        float dif = clamp((col.w - map(pos+0.6*sundir).w)/0.6, 0.0, 1.0 );
        vec3 lin = vec3(0.51, 0.53, 0.63)*1.35 + 0.55*vec3(0.85, 0.57, 0.3)*dif;
        col.xyz *= lin;
        
        col.xyz *= col.xyz;
        
        col.a *= 0.35;
        col.rgb *= col.a;

        // fade samples at far field
        float fadeout = 1.-clamp((t/(DIST_MAX*.3)-.85)/.15,0.,1.); // .3 is an ugly fudge factor due to oversampling
            
        // integrate
        float thisDt = dt * sampleWt( wt, even); // blend in dts
        thisDt = sqrt(thisDt/5. )*5.; // hack to soften and brighten
        sum += thisDt * col * (1.0 - sum.a) * fadeout;

        // next sample
        nextT( t, dt, wt, even );
    }

    sum.xyz /= (0.001+sum.w);

    return clamp( sum, 0.0, 1.0 );
}

vec3 sky( vec3 rd )
{
    vec3 col = vec3(0.);
    
    float hort = 1. - clamp(abs(rd.y), 0., 1.);
    col += 0.5*vec3(.99,.5,.0)*exp2(hort*8.-8.);
    col += 0.1*vec3(.5,.9,1.)*exp2(hort*3.-3.);
    col += 0.55*vec3(.6,.6,.9);
    
    float sun = clamp( dot(sundir,rd), 0.0, 1.0 );
    col += .2*vec3(1.0,0.3,0.2)*pow( sun, 2.0 );
    col += .5*vec3(1.,.9,.9)*exp2(sun*650.-650.);
    col += .1*vec3(1.,1.,0.1)*exp2(sun*100.-100.);
    col += .3*vec3(1.,.7,0.)*exp2(sun*50.-50.);
    col += .5*vec3(1.,0.3,0.05)*exp2(sun*10.-10.); 
    
    float ax = atan(rd.y,length(rd.xz))/1.;
    float ay = atan(rd.z,rd.x)/2.;
    float st = texture( iChannel0, vec2(ax,ay) ).x;
    float st2 = texture( iChannel0, .25*vec2(ax,ay) ).x;
    st *= st2;
    st = smoothstep(0.65,.9,st);
    col = mix(col,col+1.8*st,clamp(1.-1.1*length(col),0.,1.));
    
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    sundir = normalize(vec3(iMouse.x/iResolution.x,0.0,iMouse.y/iResolution.y));
    vec2 q = fragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0*q;
    p.x *= iResolution.x/ iResolution.y;
    vec2 mo = -1.0 + 2.0*iMouse.xy / iResolution.xy;
   
    // camera
    vec3 ro = vec3(iMouse.x/iResolution.x,((iMouse.y/iResolution.y) +1.),0.) + iTime*camVel;
    vec3 ta = ro + lookDir; //vec3(ro.x, ro.y, ro.z-1.);
    vec3 ww = normalize( ta + ro);
    vec3 uu = (cross( vec3(iTravel,iTravel,0.0), ww ));
    vec3 vv = normalize(cross(ww,uu));
    vec3 rd = normalize( p.x*uu + 1.2*p.y*vv + 1.5*ww );
    
    // sky
    vec3 col = vec3(0.0,0.0,0.0); //sky(rd);
    
    // divide by forward component to get fixed z layout instead of fixed dist layout
    vec3 rd_layout = rd/mix(dot(rd,ww),1.0,samplesCurvature);
    vec4 clouds = raymarch( ro, rd_layout );
    
    col = mix( col, clouds.xyz, clouds.w );
    
	col = clamp(col, 0., 1.);
    col = smoothstep(0.,1.,col);
	col *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.12 ); //Vign
    vec4 black = vec4(0.0,0.0,0.0,1.0);
    fragColor = vec4( col, 1.0 );
    if(fragColor.r <= 0.16 && fragColor.g <= 0.16 && fragColor.b <= 0.16 )
    {fragColor = stars(fragCoord);}
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
