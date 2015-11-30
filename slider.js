        $(document).ready(function(){ $(".slider-wrap").each(function(){

          var $wrap = $(this);
          var $slider = $(this).find(".slider");

          //slider
          var sliderSlideTime = $slider.data("display-time");
          var sliderSlideSpeed = $slider.data("transition-time");
          var sliderSlideWidth = $slider.data("slide-width");
          var sliderSlideUnits = $slider.data("slide-units");
          var sliderBreakpoints = $slider.data("breakpoints") ? $slider.data("breakpoints") : [];
          var sliderAutoplay = $slider.data("autoplay");
          var sliderSelector = $slider.data("selector");
          var sliderInfinite = $slider.data("infinite");
          var sliderStartAt = isNaN($slider.data("start-at")) ? 1 : $slider.data("start-at");

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
            $slider.css({left: -(sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits});

            var i = 0;
            if(sliderInfinite)
            {
              i = -1;
              if($slider.find(sliderSelector).length > 4) i = -2;
            }

            $slider.find(sliderSelector).each(function(){
              var thisLeft = i * sliderSlideWidth;
              $(this).css({left: thisLeft + sliderSlideUnits, width: sliderSlideWidth + sliderSlideUnits});
              i++;
            });
          }

          //if endless slider, make sure we have at least slide on each side (2 if possible)
          if(sliderInfinite)
          {
            $slider.find(sliderSelector + ":last-child").css({left: "-" + sliderSlideWidth + sliderSlideUnits}).prependTo($slider);
            if($slider.find(sliderSelector).length > 4) $slider.find(sliderSelector + ":last-child").css({left: "-" + (2 * sliderSlideWidth) + sliderSlideUnits}).prependTo($slider);
          }

          sizeSlider();

          $wrap.find(".prev").on("click", sliderPrev);
          $wrap.find(".next").on("click", sliderNext);
          $wrap.find(".down").on("click", function(){ scrollTo($(this).data("destination")); });

          for(var i = 0; i < $slider.find(sliderSelector).length; i++)
          {
            if(i == sliderCurrPosition) $wrap.find(".pager").append('<span class="active"></span>');
            else $wrap.find(".pager").append('<span></span>');
          }

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
            $(window).on("debouncedresize", resizeSlider);  
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

            $slider.animate({left: dest}, sliderSlideSpeed, function(){
              
              if(sliderInfinite)
              {
                $slider.find(sliderSelector + ":last-child").prependTo($slider);
                
                var currOff = $slider.find(sliderSelector).length > 4 ? -2 * sliderSlideWidth : -sliderSlideWidth;
                $slider.find(sliderSelector).each(function(){
                  $(this).css({left: currOff + "%"});
                  currOff+= sliderSlideWidth;
                });
                
                $slider.css({left: 0});
                $wrap.find(".pager > span:first-child").appendTo($wrap.find(".pager"));
              }

              else
              {
                $wrap.find(".pager > span").removeClass('active');
                $wrap.find(".pager > span").eq(sliderCurrPosition).addClass("active");
              }

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
              if(sliderCurrPosition < $slider.find(sliderSelector).length - 1) 
              {
                sliderCurrPosition++;
              }
              dest = -(sliderCurrPosition * sliderSlideWidth) + sliderSlideUnits;
            }

            $slider.animate({left: dest}, sliderSlideSpeed, function(){
              if(sliderInfinite)
              {
                $slider.find(sliderSelector + ":first-child").appendTo($slider);
                
                var currOff = $slider.find(sliderSelector).length > 4 ? -2 * sliderSlideWidth : -sliderSlideWidth;
                $slider.find(sliderSelector).each(function(){
                  $(this).css({left: currOff + "%"});
                  currOff+= sliderSlideWidth;
                });
                
                $slider.css({left: 0});
                $wrap.find(".pager > span:last-child").prependTo($wrap.find(".pager"));
              }

              else
              {
                $wrap.find(".pager > span").removeClass('active');
                $wrap.find(".pager > span").eq(sliderCurrPosition).addClass("active");
              }

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
