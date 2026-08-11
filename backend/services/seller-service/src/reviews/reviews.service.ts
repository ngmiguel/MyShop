import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Seller } from '../entities/seller.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Seller) private sellersRepo: Repository<Seller>,
  ) {}

  async create(dto: CreateReviewDto) {
    if (!dto.sellerId && !dto.storeId) {
      throw new BadRequestException('sellerId ou storeId requis');
    }

    if (dto.sellerId) {
      const seller = await this.sellersRepo.findOne({ where: { id: dto.sellerId } });
      if (!seller) throw new NotFoundException('Vendeur introuvable');
    }

    const review = this.reviewsRepo.create({
      sellerId: dto.sellerId,
      storeId: dto.storeId,
      orderId: dto.orderId,
      authorName: dto.authorName,
      rating: dto.rating,
      comment: dto.comment,
    });
    await this.reviewsRepo.save(review);

    if (dto.sellerId) {
      await this.updateSellerRating(dto.sellerId);
    }

    return review;
  }

  async findAll(query: ReviewQueryDto) {
    const qb = this.reviewsRepo.createQueryBuilder('review');
    if (query.sellerId) {
      qb.andWhere('review.seller_id = :sellerId', { sellerId: query.sellerId });
    }
    if (query.storeId) {
      qb.andWhere('review.store_id = :storeId', { storeId: query.storeId });
    }
    qb.orderBy('review.created_at', 'DESC');
    return qb.getMany();
  }

  private async updateSellerRating(sellerId: string) {
    const result = await this.reviewsRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.seller_id = :sellerId', { sellerId })
      .getRawOne<{ avg: string; count: string }>();

    await this.sellersRepo.update(sellerId, {
      rating: parseFloat(parseFloat(result.avg || '0').toFixed(2)),
      ratingCount: parseInt(result.count || '0', 10),
    });
  }
}
