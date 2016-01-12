$(document).ready(function(){ $(".slider-wrap").each(function(){

  var $wrap = $(this);
  var $slider = $(this).find(".slider");
  var $slides = $slider.children();

  //slider
  var sliderSlideTime = $slider.data("display-time");
  var sliderSlideSpeed = $slider.data("transition-time");
  var sliderSlideWidth = $slider.data("slide-width");
  var sliderSlideUnits = $slider.data("slide-units");
  var sliderBreakpoints = $slider.data("breakpoints") ? $slider.data("breakpoints") : [];
  var sliderAutoplay = $slider.data("autoplay");
  var sliderInfinite = $slider.data("infinite");
  var sliderStartAt = sliderInfinite || isNaN($slider.data("start-at")) ? 1 : $slider.data("start-at");

  var sliderAnimating = false;
  var sliderSwiping = false;
  var sliderCurrPosition = sliderStartAt - 1;
  var sliderSwipeStartLocX = 0;
  var sliderSwipeStartLocY = 0;
  var sliderLastTouchTimestamp = 0;
  var sliderLastTouchLocX = 0;
  var sliderLastTouchLocY = 0;
  var sliderTransitionResetRequired = false;
  var sliderFirstTouchCheck = false;
  var sliderIgnoreNextTouchEnd = false;

  function sizeSlider()
  {
    if(sliderInfinite) $slider.css({left: 0});
    else $slider.css({left: -(sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits});

    var i = 0;
    if(sliderInfinite)
    {
      i = -Math.floor(($slides.length - 1) / 2);
    }

    $slides.each(function(){
      var thisLeft = i * sliderSlideWidth;
      $(this).css({left: thisLeft + sliderSlideUnits, width: sliderSlideWidth + sliderSlideUnits});
      i++;
    });
  }

  for(var i = 0; i < $slides.length; i++)
  {
    $wrap.find(".pager").append('<span></span>');
  }

  $wrap.find(".pager > span").eq(sliderCurrPosition).addClass("active");
  $slides.eq(sliderCurrPosition).addClass("active");

  //if infinite slider, make sure we have slides on either side
  if(sliderInfinite)
  {
    var slidesToMove = Math.floor(($slides.length - 1) / 2);
    for(var i = 0; i < slidesToMove; i++)
    {
      var mult = (i + 1);
      $slides.last().css({left: "-" + (mult * sliderSlideWidth) + sliderSlideUnits}).prependTo($slider);
      $slides = $slider.children();
    }
  }

  sizeSlider();

  $wrap.find(".prev").on("click", sliderPrev);
  $wrap.find(".next").on("click", sliderNext);
  $wrap.find(".down").on("click", function(){ scrollTo($(this).data("destination")); });

  if(sliderAutoplay) var sliderInt = setInterval(sliderNext, sliderSlideTime);

  if(sliderBreakpoints.length > 0)
  {
    function resizeSlider()
    {
      for(var i = 0; i < sliderBreakpoints.length; i++)
      {
        if(window.matchMedia('(max-width: ' + sliderBreakpoints[i][0] + 'px)').matches)
        {
          sliderSlideWidth = sliderBreakpoints[i][1];
          sizeSlider();
          break;
        }
      }
    }
    $(window).on("resize debouncedresize", resizeSlider);  
    $(window).on("orientationchange", function(){ setTimeout(resizeSlider, 150);});
    resizeSlider();
  }

  function sliderPrev()
  {
    if(sliderSwiping || sliderAnimating) return;
    else sliderAnimating = true;

    var dest = sliderSlideWidth + sliderSlideUnits;
    if(!sliderInfinite)
    {
      if(sliderCurrPosition > 0) sliderCurrPosition--;
      dest = -(sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits;
    }

    else sliderCurrPosition--;

    $slider.animate({left: dest}, sliderSlideSpeed, function(){
      
      if(sliderInfinite)
      {
        $slides.last().prependTo($slider);
        $slides = $slider.children();
        
        var currOff = -Math.floor(($slides.length - 1) / 2) * sliderSlideWidth;
        $slides.each(function(){
          $(this).css({left: currOff + "%"});
          currOff+= sliderSlideWidth;
        });
        
        $slider.css({left: 0});
      }

      $wrap.find(".pager > span").removeClass("active");
      $wrap.find(".pager > span").eq(sliderCurrPosition % $slides.length).addClass("active");

      $slides.removeClass("active");
      if(sliderInfinite) $slides.eq(Math.floor(($slides.length - 1) / 2)).addClass("active");
      else $slides.eq(sliderCurrPosition % $slides.length).addClass("active");

      sliderAnimating = false;

      if(sliderAutoplay)
      {
        clearInterval(sliderInt);
        sliderInt = setInterval(sliderNext, sliderSlideTime);
      }
    });
  }



  function sliderNext()
  {
    if(sliderSwiping || sliderAnimating) return;
    else sliderAnimating = true;

    var dest = "-" + sliderSlideWidth + sliderSlideUnits;
    if(!sliderInfinite)
    {
      if(sliderCurrPosition < $slides.length - 1) sliderCurrPosition++;
      dest = -(sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits;
    }

    else sliderCurrPosition++;

    $slider.animate({left: dest}, sliderSlideSpeed, function(){
      if(sliderInfinite)
      {
        $slides.first().appendTo($slider);
        $slides = $slider.children();
        
        var currOff = -Math.floor(($slides.length - 1) / 2) * sliderSlideWidth;
        $slides.each(function(){
          $(this).css({left: currOff + "%"});
          currOff+= sliderSlideWidth;
        });
        
        $slider.css({left: 0});
      }

      $wrap.find(".pager > span").removeClass("active");
      $wrap.find(".pager > span").eq(sliderCurrPosition % $slides.length).addClass("active");

      $slides.removeClass("active");
      
      if(sliderInfinite) $slides.eq(Math.floor(($slides.length - 1) / 2)).addClass("active");
      else $slides.eq(sliderCurrPosition % $slides.length).addClass("active");

      sliderAnimating = false;

      if(sliderAutoplay)
      {
        clearInterval(sliderInt);
        sliderInt = setInterval(sliderNext, sliderSlideTime);
      }
    });
  }

  

  $slider.on("touchstart", function(e){ 
    if(sliderAnimating)
    {
      sliderTransitionResetRequired = true;
      return;
    }

    sliderSwiping = true;
    sliderFirstTouchCheck = true;
    sliderSwipeStartLocX = e.originalEvent.touches[0].clientX;
    sliderSwipeStartLocY = e.originalEvent.touches[0].clientY;
  });
  
  $slider.on("touchend", function(e){
    if(sliderIgnoreNextTouchEnd)
    {
      sliderIgnoreNextTouchEnd = false;
      return;
    }

    else if((sliderAnimating && !sliderTransitionResetRequired)) return;

    
    var distX = -(sliderSwipeStartLocX - sliderLastTouchLocX);
    var speed = Math.abs(distX) / 4;
    if(speed < 100) speed = 100;

    sliderSwiping = false;
    sliderTransitionResetRequired = false;

    if(sliderLastTouchLocX == 0) return;
    
    if(distX > 40) sliderPrev();
    else if(distX < -40) sliderNext();
    else $(this).animate({left: (-sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits}, speed);

    sliderSwipeStartLocX = 0;
    sliderSwipeStartLocY = 0;
  });
  
  $slider.on("touchmove", function(e){
    
    if( sliderFirstTouchCheck && 
        Math.abs(sliderSwipeStartLocY - e.originalEvent.touches[0].clientY) > Math.abs(sliderSwipeStartLocX - e.originalEvent.touches[0].clientX))
    {
      sliderFirstTouchCheck = false;
      sliderIgnoreNextTouchEnd = true;
      return;
    }

    else if( sliderAnimating || 
        sliderIgnoreNextTouchEnd ||
        sliderTransitionResetRequired || 
        Date.now() - sliderLastTouchTimestamp < 16.667) 
      return;
    
    e.preventDefault();
    sliderFirstTouchCheck = false;
    sliderLastTouchTimestamp = Date.now();
    sliderLastTouchLocX = e.originalEvent.touches[0].clientX;
    sliderLastTouchLocY = e.originalEvent.touches[0].clientY;
    
    var distX = -(sliderSwipeStartLocX - sliderLastTouchLocX);
    if(sliderInfinite) $(this).css({left: distX});
    else 
    {
      var dest = ((-sliderCurrPosition * sliderSlideWidth) + distX) + sliderSlideUnits;
      if(sliderSlideUnits == "%") 
      {
        var distXPercent = (distX / window.innerWidth) * 100;
        dest = ((-sliderCurrPosition * sliderSlideWidth) + distXPercent) + sliderSlideUnits
      }
      $(this).css({left: dest});
    }
  });

}); });
