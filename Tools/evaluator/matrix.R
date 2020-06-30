library(tidyverse)
m <- matrix(1, nrow = 46, ncol = 9)

hm <- m
nrow(m)

rovals <- m
covals <- m
for(row in 1:nrow(m)) {
  for(col in 1:ncol(m)) {
    
    rowVal <- (1/( (ncol(m)+0.001)-1))*(ncol(m)-col)
    
    colVal<- (1/( (nrow(m)+0.001)-1))*(nrow(m)-row)
    
    rovals[row,col] <- rowVal
    covals[row,col] <- colVal
    
    hm[row,col] <- (rowVal+colVal)/2
  }
}
hm <- hm %>% round(digits = 2)

hm 
  
  
hm[,1] %>% sum()
hm[,2] %>% sum()
hm[,3] %>% sum()
hm[,4] %>% sum()
