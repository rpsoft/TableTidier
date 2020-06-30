# AutoAnnotator Runs analysis
library(tidyverse)
library(readr)
library(ggpubr)

simple_P <- read_csv("ihw/tableAnnotator/tools/evaluator/simple_P.csv", col_names = FALSE)
semtypes_P <- read_csv("ihw/tableAnnotator/tools/evaluator/semtypes_P.csv", col_names = FALSE)
cuis_P <- read_csv("ihw/tableAnnotator/tools/evaluator/cuis_P.csv", col_names = FALSE)
umls_P <- read_csv("ihw/tableAnnotator/tools/evaluator/umls_P.csv", col_names = FALSE)

colnames(simple_P) = c("table","score_simple")
colnames(semtypes_P) = c("table","score_semtypes")
colnames(cuis_P) = c("table","score_cuis")
colnames(umls_P) = c("table","score_umls")

all_PS <- simple_P %>% inner_join(cuis_P) %>% inner_join(umls_P) %>% inner_join(semtypes_P)


# all_PS %<>% 
#   mutate ( cuisBetter = score_cuis > score_simple ) %>%
#   mutate ( umlsBetter = score_umls > score_simple ) %>%
#   mutate ( umlsBetter_cuis = score_umls > score_cuis )
# 
# t.test(all_PS %>% pull("score_simple"), all_PS %>% pull("score_cuis"), paired = TRUE)
# 
# t.test(all_PS %>% pull("score_simple"), all_PS %>% pull("score_umls"), paired = TRUE)
# 
# t.test(all_PS %>% pull("score_cuis"), all_PS %>% pull("score_umls"), paired = TRUE)

# 
# dotchart(all_PS %>% pull("score_simple"), labels = all_PS %>% pull("table"),
#          cex = 0.6)
# 
# install.packages("car")
# library(car)
# 
# scatterplot(score_umls ~ score_simple, data = all_PS, grid = FALSE, frame = FALSE)

# 
# scatterplot(score_simple ~ score_umls, data = all_PS, 
#             smoother = FALSE, grid = FALSE, frame = FALSE)

# id <- mtcars %>% tibble::rownames_to_column() %>% as_tibble()
# id <- id %>% mutate(am = factor(am, levels = c(0, 1), labels = c("automatic", "manual")))
# 
# gd <- id %>% 
#   group_by(am) %>% 
#   summarise(hp = mean(hp))
# 
# ggplot(id, aes(x = am, y = hp, color = am, fill = am)) +
#   geom_point() +
#   geom_bar(data = gd, stat = "identity", alpha = .3)
# 
# all_PS

# mtcars %>% 
#   mutate(am = factor(am, levels = c(0, 1), labels = c("Automatic", "Manual"))) %>% 
#   ggplot(aes(x = am, y = hp, group = am, fill = am)) +
#   geom_boxplot(alpha = .7) +
#   geom_jitter(width = .05, alpha = .4) +
#   guides(fill = "none") +
#   theme_bw() +
#   labs(
#     x = "Transmission",
#     y = "Horsepower"
#   )

# install.packages("ggpubr")


colnames(simple_P) = c("table","score")
colnames(semtypes_P) = c("table","score")
colnames(cuis_P) = c("table","score")
colnames(umls_P) = c("table","score")

mean(simple_P %>% pull("score"))
mean(semtypes_P %>% pull("score"))
mean(cuis_P %>% pull("score"))
mean(umls_P %>% pull("score"))


simple_P <- simple_P %>% mutate (method = "Basic") %>% select(-table)
semtypes_P <- semtypes_P %>% mutate (method = "UMLS-SemTypes") %>% select(-table)
cuis_P <- cuis_P %>% mutate (method = "UMLS-CUIs") %>% select(-table)
umls_P <- umls_P %>% mutate (method = "UMLS-Full") %>% select(-table)

all_data <- simple_P %>% rbind(semtypes_P) %>% rbind(cuis_P) %>% rbind(umls_P) 

# colnames(all_data) = c("score", "method")

my_comparisons <- list( c("Basic", "UMLS-SemTypes"), c("UMLS-CUIs", "UMLS-SemTypes"), c("UMLS-CUIs", "UMLS-Full") , c("Basic", "UMLS-CUIs"), c("UMLS-SemTypes", "UMLS-Full"),   c("Basic", "UMLS-Full"))
ggboxplot(all_data, x = "method", y = "score", ylab = "Difference Score (511 Tables)", xlab = "" , color = "method", palette = "jco") +
      geom_jitter(shape=8, position=position_jitter(0.2), alpha=.3, aes(colour=method))  +
      stat_compare_means(method="wilcox.test",label= "p.signif", ref.group = ".all.", comparisons = my_comparisons, paired = TRUE) +
      labs(colour = "Classifier Feature Set")



# 
# p <- ggboxplot(ToothGrowth, x = "supp", y = "len",
#                color = "supp", palette = "jco",
#                add = "jitter",
#                facet.by = "dose", short.panel.labs = FALSE)
# # Use only p.format as label. Remove method name.
# p + stat_compare_means(label = "p.format")

# p <- ggboxplot(all_data , x = "method", y = "score",
#                color = "method", palette = "jco",
#                add = "jitter")
# 
# #  Add p-value
# p + stat_compare_means()
# # Change method
# p + stat_compare_means(method = "t.test", paired = TRUE)
# 
# 
# 
# ggpaired(simple_P %>% rbind(cuis_P) , x = "method", y = "score",
#          color = "method", line.color = "gray", line.alpha = 0.9, line.size = 0.4,
#          palette = "jco")+
#   stat_compare_means(paired = TRUE)
# 
# 
# ggboxplot(all_data, x = "method", y = "score",
#           color = "method", palette = "jco")+
#   stat_compare_means()
# 
# my_comparisons <- list( c("simple", "cuis"), c("simple", "umls"), c("cuis", "umls") )
# ggboxplot(all_data, x = "method", y = "score",
#           color = "method", palette = "jco")+ 
#   stat_compare_means(comparisons = my_comparisons, paired = TRUE) # Add pairwise comparisons p-value